import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    proto 
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { getSupabaseAuthState } from "./supabase-auth-state";
import pino from "pino";
import { BotContext } from "./types";
import { handleIncomingMessage } from "./handlers/message-handler";
import { setupOutgoingMessageListener } from "./handlers/outgoing-handler";
import { checkRLSError } from "./utils";

const logger = pino({ level: "info" });

export async function startWhatsAppBot(supabase: SupabaseClient<Database>, sessionId: string) {
    // 1. Ensure Session Exists (Critical for Foreign Keys)
    const { error: initError } = await supabase.from("whatsapp_sessions_metadata").upsert({
        session_id: sessionId,
        status: "initializing",
        updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });
    
    if (initError) {
        console.error("Failed to initialize session record:", initError);
        checkRLSError(initError);
    } else {
        console.log("Session record initialized in DB:", sessionId);
    }

    const { state, saveCreds } = await getSupabaseAuthState(supabase, sessionId);
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
        // Provide a function to retrieve messages to handle retries
        getMessage: async (key) => {
            const { data } = await supabase
                .from("whatsapp_messages")
                .select("content")
                .eq("session_id", sessionId)
                .eq("message_id", key.id!)
                .single();
            
            if (data?.content) {
                return {
                    conversation: data.content
                } as proto.IMessage;
            }
            return {
                conversation: "Hello"
            } as proto.IMessage;
        }
    });

    // Create Context
    const ctx: BotContext = { sock, supabase, sessionId };

    // Process all events in a single batch handler for better performance
    sock.ev.process(async (events) => {
        // Handle Credentials Update
        if (events["creds.update"]) {
            await saveCreds();
        }

        // Handle Connection Update
        if (events["connection.update"]) {
            const update = events["connection.update"];
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("New QR Code generated. Saving to DB...");
                const { error } = await supabase.from("whatsapp_sessions_metadata").upsert({
                    session_id: sessionId,
                    qr_code: qr,
                    status: "connecting",
                    updated_at: new Date().toISOString()
                });
                if (error) checkRLSError(error);
            }

            if (connection === "close") {
                const error = lastDisconnect?.error as Error | undefined;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log("Connection closed due to ", error, ", reconnecting ", shouldReconnect);
                
                // CRITICAL ERROR CHECK
                const errorMessage = error?.message || "";
                if (errorMessage.includes("bad decrypt")) {
                     console.error("CRITICAL: Session corrupted (Bad Decrypt). Stopping bot.");
                     console.error("Please clear the session from the database and restart.");
                     process.exit(1); // Hard stop only for decryption failure
                }

                if (errorMessage.includes("Stream Errored")) {
                    console.log("Stream error detected, attempting normal reconnection...");
                }

                const { error: dbError } = await supabase.from("whatsapp_sessions_metadata").upsert({
                    session_id: sessionId,
                    status: "disconnected",
                    updated_at: new Date().toISOString()
                });
                if (dbError) checkRLSError(dbError);

                if (shouldReconnect) {
                    startWhatsAppBot(supabase, sessionId);
                }
            } else if (connection === "open") {
                console.log("Opened connection");
                const user = sock.user;
                const { error } = await supabase.from("whatsapp_sessions_metadata").upsert({
                    session_id: sessionId,
                    status: "connected",
                    phone_number: user?.id.split(":")[0],
                    qr_code: null,
                    updated_at: new Date().toISOString()
                });
                if (error) checkRLSError(error);
            }
        }

        // Handle History Sync (Initial Messages)
        if (events["messaging-history.set"]) {
            const { chats, contacts, messages } = events["messaging-history.set"];
            console.log(`Received History Sync: ${messages.length} messages, ${chats.length} chats, ${contacts.length} contacts.`);
            
            // Process messages
            for (const msg of messages) {
                // history messages are wrapped, but Baileys types usually match WAMessage
                await handleIncomingMessage(ctx, msg);
            }
        }

        // Handle Incoming Messages
        if (events["messages.upsert"]) {
            const m = events["messages.upsert"];
            if (m.type === "notify" || m.type === "append") {
                for (const msg of m.messages) {
                    await handleIncomingMessage(ctx, msg);
                }
            }
        }
    });

    // Setup Outgoing Listener
    setupOutgoingMessageListener(ctx);

    return sock;
}