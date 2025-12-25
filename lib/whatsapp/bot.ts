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
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("New QR Code generated. Saving to DB...");
            const { error } = await supabase.from("whatsapp_sessions_metadata").upsert({
                session_id: sessionId,
                qr_code: qr,
                status: "connecting",
                updated_at: new Date().toISOString()
            });
            
            if (error) {
                console.error("Failed to save QR code:", error);
            } else {
                console.log("QR code saved successfully.");
            }
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
            
            await supabase.from("whatsapp_sessions_metadata").upsert({
                session_id: sessionId,
                status: "disconnected",
                updated_at: new Date().toISOString()
            });

            // reconnect if not logged out
            if (shouldReconnect) {
                startWhatsAppBot(supabase, sessionId);
            }
        } else if (connection === "open") {
            console.log("Opened connection");
            const user = sock.user;
            await supabase.from("whatsapp_sessions_metadata").upsert({
                session_id: sessionId,
                status: "connected",
                phone_number: user?.id.split(":")[0], // Extract phone from JID
                qr_code: null, // Clear QR code
                updated_at: new Date().toISOString()
            });
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify" || m.type === "append") {
            for (const msg of m.messages) {
                if (msg.message) { // Process all messages, not just from others
                    const isFromMe = msg.key.fromMe || false;
                    const remoteJid = msg.key.remoteJid;
                    const messageId = msg.key.id;
                    
                    if (!remoteJid) continue;

                    // Extract text content (simplify for now)
                    const text = 
                        msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || 
                        msg.message.imageMessage?.caption ||
                        "";

                    console.log(`Received message from ${remoteJid}: ${text}`);

                    // 1. Check if chat exists
                    const { data: existingChat } = await supabase
                        .from("whatsapp_chats")
                        .select("*")
                        .eq("session_id", sessionId)
                        .eq("jid", remoteJid)
                        .single();

                    let chatId;

                    if (existingChat) {
                        chatId = existingChat.id;
                        const updatePayload: any = {
                            last_message_at: new Date().toISOString(),
                            last_message_content: text,
                        };
                        
                        // Only update name if we have a better one from the contact
                        if (!isFromMe && msg.pushName) {
                            updatePayload.name = msg.pushName;
                        }

                        await supabase
                            .from("whatsapp_chats")
                            .update(updatePayload)
                            .eq("id", chatId);
                    } else {
                        // Create new chat
                        const { data: newChat, error: createError } = await supabase
                            .from("whatsapp_chats")
                            .insert({
                                session_id: sessionId,
                                jid: remoteJid,
                                name: (!isFromMe && msg.pushName) ? msg.pushName : remoteJid.split("@")[0],
                                last_message_at: new Date().toISOString(),
                                last_message_content: text,
                            })
                            .select()
                            .single();
                        
                        if (createError) {
                            console.error("Error creating chat:", createError);
                            continue;
                        }
                        chatId = newChat.id;
                    }

                    // 2. Insert Message
                    if (chatId) {
                        // Check if message already exists to avoid duplicates
                        const { data: existing } = await supabase.from('whatsapp_messages').select('id').eq('session_id', sessionId).eq('message_id', messageId).single();
                        
                        if (!existing) {
                             const { error: msgError } = await supabase
                            .from("whatsapp_messages")
                            .insert({
                                chat_id: chatId,
                                session_id: sessionId,
                                message_id: messageId,
                                sender_jid: isFromMe ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net' : remoteJid, // Approximate sender JID for 'me'
                                content: text,
                                message_type: Object.keys(msg.message)[0],
                                timestamp: new Date((msg.messageTimestamp as number) * 1000).toISOString(),
                                is_from_me: isFromMe,
                                status: 'delivered'
                            });
                        
                            if (msgError) {
                                console.error("Error saving message:", msgError);
                            }
                        }
                    }
                    
                    // TODO: Implement token verification logic here
                }
            }
        }
    });

    // Listen for outgoing messages from Supabase
    console.log("Subscribing to outgoing messages for session:", sessionId);
    const channel = supabase
        .channel(`bot-sending-${sessionId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "whatsapp_messages",
                filter: `session_id=eq.${sessionId}`,
            },
            async (payload) => {
                const newMsg = payload.new as any;
                if (newMsg.is_from_me && newMsg.status === 'sent') {
                    console.log("Processing outgoing message:", newMsg.id);
                    
                    // 1. Get Chat JID
                    const { data: chat } = await supabase
                        .from("whatsapp_chats")
                        .select("jid")
                        .eq("id", newMsg.chat_id)
                        .single();
                    
                    if (chat && chat.jid) {
                        try {
                            // 2. Send via WhatsApp
                            const sentMsg = await sock.sendMessage(chat.jid, { text: newMsg.content });
                            console.log("Message sent to WhatsApp:", chat.jid, sentMsg?.key.id);
                            
                            // 3. Update status and message_id to prevent duplicate insertion from echo
                            if (sentMsg?.key.id) {
                                await supabase
                                    .from("whatsapp_messages")
                                    .update({ 
                                        status: "delivered",
                                        message_id: sentMsg.key.id
                                    })
                                    .eq("id", newMsg.id);
                            }
                                
                        } catch (err) {
                            console.error("Failed to send message:", err);
                        }
                    }
                }
            }
        )
        .subscribe();


    return sock;
}
