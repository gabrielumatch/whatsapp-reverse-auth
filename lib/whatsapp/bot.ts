import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { useSupabaseAuthState } from "./supabase-auth-state";
import pino from "pino";

const logger = pino({ level: "info" });

export async function startWhatsAppBot(supabase: SupabaseClient<Database>, sessionId: string) {
    const { state, saveCreds } = await useSupabaseAuthState(supabase, sessionId);
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
        printQRInTerminal: true, // For initial pairing
        generateHighQualityLink: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("New QR Code generated. Please scan it.");
            // In a real app, we might emit this via a socket or save to DB for the dashboard
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
            // reconnect if not logged out
            if (shouldReconnect) {
                startWhatsAppBot(supabase, sessionId);
            }
        } else if (connection === "open") {
            console.log("Opened connection");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.message) {
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
                    const from = msg.key.remoteJid;
                    
                    console.log(`Received message from ${from}: ${text}`);
                    
                    // TODO: Implement token verification logic here
                }
            }
        }
    });

    return sock;
}
