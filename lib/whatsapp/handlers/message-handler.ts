import { WAMessage } from "@whiskeysockets/baileys";
import { BotContext } from "../types";
import { getOrCreateChat } from "./chat-handler";
import { syncContact } from "./contact-handler";
import { downloadAndUploadMedia } from "./media-handler";
import Long from "long";

export async function handleIncomingMessage(ctx: BotContext, m: WAMessage) {
    const { supabase, sessionId, sock } = ctx;

    if (!m.message) return;

    const key = m.key;
    const remoteJid = key.remoteJid;
    const messageId = key.id;
    const isFromMe = key.fromMe || false;

    if (!remoteJid || !messageId) return;

    // Extract content
    const msgType = Object.keys(m.message)[0];
    
    // Text extraction logic
    let text = "";
    let caption = null;

    if (msgType === 'conversation') {
        text = m.message.conversation || "";
    } else if (msgType === 'extendedTextMessage') {
        text = m.message.extendedTextMessage?.text || "";
    } else if (msgType === 'imageMessage') {
        caption = m.message.imageMessage?.caption || null;
        text = caption || "📷 Image";
    } else if (msgType === 'videoMessage') {
        caption = m.message.videoMessage?.caption || null;
        text = caption || "🎥 Video";
    } else {
        text = msgType;
    }

    console.log(`Received message from ${remoteJid}: ${text}`);

    // Determine Push Name logic for Chat Naming
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

    // 3. Handle Media Download
    let mediaPath: string | null = null;
    if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(msgType)) {
        mediaPath = await downloadAndUploadMedia(ctx, m);
    }

    // 4. Insert Message
    const timestamp = getMessageTimestamp(m.messageTimestamp);
    
    const { error: msgError } = await supabase
        .from("whatsapp_messages")
        .insert({
            chat_id: chatId,
            session_id: sessionId,
            message_id: messageId,
            sender_jid: isFromMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : remoteJid,
            content: text, // Display text (caption or placeholder)
            caption: caption,
            media_url: mediaPath, // Path in bucket
            message_type: msgType,
            timestamp: timestamp.toISOString(),
            is_from_me: isFromMe,
            status: "delivered", 
        });

    if (msgError) {
        console.error("Error saving message:", msgError);
    }

    // 5. Background: Sync Contact Info (Profile Pic, About)
    if (!isFromMe) {
        // Fire and forget - don't await
        syncContact(ctx, remoteJid, contactName).catch(err => 
            console.error("Background sync failed:", err)
        );
    }
}

function getMessageTimestamp(ts: number | Long | null | undefined): Date {
    if (typeof ts === 'number') {
        return new Date(ts * 1000);
    }
    // Handle Long object (has low/high or toNumber)
    if (ts && typeof ts === 'object' && 'toNumber' in ts && typeof (ts as { toNumber: unknown }).toNumber === 'function') {
        return new Date((ts as { toNumber: () => number }).toNumber() * 1000);
    }
    // Fallback to now if missing
    return new Date();
}
