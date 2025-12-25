import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { getRedisAuthState } from "./redis-auth-state";
import { logger } from "@/lib/logger";
import { BotContext } from "./types";
import { handleIncomingMessage } from "./handlers/message-handler";
import { setupOutgoingMessageListener } from "./handlers/outgoing-handler";
import { SessionRepository } from "./repositories/session-repository";
import { ChatRepository } from "./repositories/chat-repository";
import { MessageRepository } from "./repositories/message-repository";
import { ContactRepository } from "./repositories/contact-repository";
import { MessageProcessor } from "./workers/message-processor";

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
    try {
        await sessionRepo.initialize(sessionId);
        logger.info({ sessionId }, "Session record initialized in DB");
    } catch (error: unknown) {
        logger.error({ sessionId, err: error }, "Failed to initialize session record");
    }

    const { state, saveCreds } = await getRedisAuthState(redis, sessionId);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    logger.info({ version: version.join("."), isLatest }, "Starting WhatsApp Bot");

    const sock = makeWASocket({
        version,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger: logger as any, // Pass our pino logger to Baileys
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/receive messages */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keys: makeCacheableSignalKeyStore(state.keys, logger as any),
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
                logger.info({ sessionId }, "New QR Code generated");
                await sessionRepo.updateQr(sessionId, qr);
                await redis.publish('updates:session-status', JSON.stringify({ id: sessionId, status: 'connecting', qrCode: qr }));
            }

            if (connection === "close") {
                const error = lastDisconnect?.error as Error | undefined;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                logger.warn({ sessionId, err: error, shouldReconnect }, "Connection closed");
                
                if (error?.message?.includes("bad decrypt")) {
                     logger.fatal({ sessionId }, "CRITICAL: Session corrupted. Stopping.");
                     process.exit(1);
                }

                await sessionRepo.updateStatus(sessionId, "disconnected");
                await redis.publish('updates:session-status', JSON.stringify({ id: sessionId, status: 'disconnected' }));

                if (shouldReconnect) {
                    startWhatsAppBot(prisma, redis, sessionId);
                }
            } else if (connection === "open") {
                logger.info({ sessionId }, "Opened connection");
                const phoneNumber = sock.user?.id.split(":")[0];
                await sessionRepo.updateStatus(sessionId, "connected", phoneNumber);
                await redis.publish('updates:session-status', JSON.stringify({ id: sessionId, status: 'connected', phoneNumber }));
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
            logger.info({ sessionId, msgCount: messages.length, contactCount: contacts.length }, "Received History Sync");
            
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