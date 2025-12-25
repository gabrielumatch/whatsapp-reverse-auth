import { WAMessage, proto } from "@whiskeysockets/baileys";
import { BotContext } from "../types";
import { getOrCreateChat } from "./chat-handler";

export async function handleIncomingMessage(ctx: BotContext, m: WAMessage) {
    const { supabase, sessionId, sock } = ctx;

    if (!m.message) return;

    const key = m.key;
    const remoteJid = key.remoteJid;
    const messageId = key.id;
    const isFromMe = key.fromMe || false;

    if (!remoteJid) return;

    // Extract text content
    const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        ""; // Handle other types as needed

    console.log(`Received message from ${remoteJid}: ${text}`);

    // Determine Push Name logic for Chat Naming
    // If incoming (!isFromMe), use m.pushName.
    // If outgoing (isFromMe), do NOT use m.pushName (it's us). Pass null so logic uses JID or existing name.
    const contactName = !isFromMe ? m.pushName : null;

    // 1. Get or Create Chat
    const chatId = await getOrCreateChat(ctx, remoteJid, contactName, text);

    if (!chatId) return;

    // 2. Check duplicate message
    const { data: existing } = await supabase
        .from("whatsapp_messages")
        .select("id")
        .eq("session_id", sessionId)
        .eq("message_id", messageId)
        .single();

    if (existing) return;

    // 3. Insert Message
    const timestamp = getMessageTimestamp(m.messageTimestamp);
    
    const { error: msgError } = await supabase
        .from("whatsapp_messages")
        .insert({
            chat_id: chatId,
            session_id: sessionId,
            message_id: messageId,
            sender_jid: isFromMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : remoteJid,
            content: text,
            message_type: Object.keys(m.message)[0],
            timestamp: timestamp.toISOString(),
            is_from_me: isFromMe,
            status: "delivered", // incoming messages are implicitly delivered to us
        });

    if (msgError) {
        console.error("Error saving message:", msgError);
    }
}

function getMessageTimestamp(ts: number | Long | null | undefined): Date {
    if (typeof ts === 'number') {
        return new Date(ts * 1000);
    }
    // Handle Long object (has low/high or toNumber)
    if (ts && typeof ts === 'object' && 'toNumber' in ts) {
        return new Date((ts as any).toNumber() * 1000);
    }
    // Fallback to now if missing
    return new Date();
}
