import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { getRedisAuthState } from "./redis-auth-state";
import pino from "pino";
import { BotContext } from "./types";
import { handleIncomingMessage } from "./handlers/message-handler";
import { setupOutgoingMessageListener } from "./handlers/outgoing-handler";
import { SessionRepository } from "./repositories/session-repository";
import { ChatRepository } from "./repositories/chat-repository";
import { MessageRepository } from "./repositories/message-repository";
import { ContactRepository } from "./repositories/contact-repository";
import { MessageProcessor } from "./workers/message-processor";

const logger = pino({ level: "info" });

export async function startWhatsAppBot(
    prisma: PrismaClient,
    redis: Redis,
    sessionId: string
) {
    // 0. Initialize Repositories
    const sessionRepo = new SessionRepository(prisma);
    const chatRepo = new ChatRepository(prisma);
    const messageRepo = new MessageRepository(prisma);
    const contactRepo = new ContactRepository(prisma);
    
    // Initialize Workers
    const messageProcessor = new MessageProcessor(prisma, redis);
    messageProcessor.start();

    // 1. Ensure Session Exists
    const { error: initError } = (await sessionRepo.initialize(sessionId)) as any;
    // Note: Prisma returns the data, but if it failed it would throw.
    // Our repo doesn't return error object like Supabase.
    console.log("Session record initialized in DB:", sessionId);

    const { state, saveCreds } = await getRedisAuthState(redis, sessionId);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`Starting WhatsApp Bot v${version.join(".")} (latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/receive messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        getMessage: async (key) => {
            const msg = await messageRepo.findById(sessionId, key.id!);
            return msg?.content ? { conversation: msg.content } : undefined;
        }
    });

    // Create Context
    const ctx: BotContext = { 
        sock, prisma, redis, sessionId,
        sessionRepo, chatRepo, messageRepo, contactRepo,
        messageProcessor
    };

    // Process events
    sock.ev.process(async (events) => {
        if (events["creds.update"]) {
            await saveCreds();
        }

        if (events["connection.update"]) {
            const { connection, lastDisconnect, qr } = events["connection.update"];

            if (qr) {
                console.log("New QR Code generated.");
                await sessionRepo.updateQr(sessionId, qr);
            }

            if (connection === "close") {
                const error = lastDisconnect?.error as Error | undefined;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log("Connection closed due to ", error, ", reconnecting ", shouldReconnect);
                
                if (error?.message?.includes("bad decrypt")) {
                     console.error("CRITICAL: Session corrupted. Stopping.");
                     process.exit(1);
                }

                await sessionRepo.updateStatus(sessionId, "disconnected");

                if (shouldReconnect) {
                    startWhatsAppBot(prisma, redis, sessionId);
                }
            } else if (connection === "open") {
                console.log("Opened connection");
                await sessionRepo.updateStatus(sessionId, "connected", sock.user?.id.split(":")[0]);
            }
        }

        if (events["messages.upsert"]) {
            const m = events["messages.upsert"];
            if (m.type === "notify" || m.type === "append") {
                for (const msg of m.messages) {
                    await handleIncomingMessage(ctx, msg);
                }
            }
        }
        
        // Handle History Sync (Initial Messages & Contacts)
        if (events["messaging-history.set"]) {
            const { messages, contacts } = events["messaging-history.set"];
            console.log(`Received History Sync: ${messages.length} messages, ${contacts.length} contacts.`);
            
            // Sync Contacts (Names)
            for (const contact of contacts) {
                // contact: { id: string, name?: string, notify?: string }
                // 'name' is usually the address book name, 'notify' is the pushname.
                const name = contact.name || contact.notify;
                if (name) {
                    // Update Chat Name
                    await ctx.chatRepo.upsertChat(sessionId, contact.id, { name });
                    // Update Contact Record
                    await ctx.contactRepo.upsertContact(sessionId, contact.id, { name });
                }
            }

            for (const msg of messages) {
                await handleIncomingMessage(ctx, msg);
            }
        }

        // Handle Contact Updates (Live)
        if (events["contacts.upsert"]) {
            const contacts = events["contacts.upsert"];
            for (const contact of contacts) {
                const name = contact.name || contact.notify;
                if (name) {
                    await ctx.chatRepo.upsertChat(sessionId, contact.id, { name });
                    await ctx.contactRepo.upsertContact(sessionId, contact.id, { name });
                }
            }
        }
    });

    // Setup Outgoing Polling
    setupOutgoingMessageListener(ctx);

    return sock;
}