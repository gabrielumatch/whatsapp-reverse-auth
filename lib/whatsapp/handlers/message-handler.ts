import { WAMessage, proto } from "@whiskeysockets/baileys";
import { BotContext } from "../types";
import { getOrCreateChat } from "./chat-handler";
import { syncContact } from "./contact-handler";
import { downloadAndUploadMedia } from "./media-handler";
import { checkRLSError } from "../utils";

/**
 * Main processor for incoming and synced messages.
 */
export async function handleIncomingMessage(ctx: BotContext, m: WAMessage) {
    const { supabase, sessionId, sock } = ctx;

    if (!m.message) return;

    const key = m.key;
    const remoteJid = key.remoteJid;
    const messageId = key.id;
    const isFromMe = key.fromMe || false;

    if (!remoteJid || !messageId) return;

    // Extract Message Type and Content
    const msgType = Object.keys(m.message)[0];
    
    // Improved Text Extraction
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
    } else if (msgType === 'documentMessage') {
        caption = m.message.documentMessage?.caption || null;
        text = m.message.documentMessage?.fileName || "📄 Document";
    } else if (msgType === 'audioMessage') {
        text = "🎵 Audio";
    } else if (msgType === 'stickerMessage') {
        text = "🏷️ Sticker";
    } else if (msgType === 'buttonsMessage' || msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2') {
        text = "🔘 Interactive Message";
    } else {
        text = msgType; // Fallback to type name
    }

    // Determine Display Name logic
    const contactName = !isFromMe ? m.pushName : null;

    // 1. Get or Create Chat Record
    const chatId = await getOrCreateChat(ctx, remoteJid, contactName, text);
    if (!chatId) return;

    // 2. Check for Duplicate Message (especially important for syncs)
    const { data: existing, error: dupError } = await supabase
        .from("whatsapp_messages")
        .select("id")
        .eq("session_id", sessionId)
        .eq("message_id", messageId)
        .single();
    
    if (dupError && dupError.code !== 'PGRST116') {
        checkRLSError(dupError);
    }
    if (existing) return;

    // 3. Handle Media Downloads in background
    let mediaPath: string | null = null;
    if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(msgType)) {
        try {
            mediaPath = await downloadAndUploadMedia(ctx, m);
        } catch (err) {
            console.error("Failed to download/upload media:", err);
        }
    }

    // 4. Save to Database
    const timestamp = getMessageTimestamp(m.messageTimestamp);
    
    const { error: msgError } = await supabase
        .from("whatsapp_messages")
        .insert({
            chat_id: chatId,
            session_id: sessionId,
            message_id: messageId,
            sender_jid: isFromMe ? (sock.user?.id?.split(':')[0] + '@s.whatsapp.net') : remoteJid,
            content: text,
            caption: caption,
            media_url: mediaPath,
            message_type: msgType,
            timestamp: timestamp.toISOString(),
            is_from_me: isFromMe,
            status: "delivered", 
        });

    if (msgError) {
        checkRLSError(msgError);
    }

    // 5. Background: Sync Contact Info
    if (!isFromMe) {
        syncContact(ctx, remoteJid, contactName).catch(() => {});
    }
}

/**
 * Safely converts Baileys timestamp (number or Long) to JS Date.
 */
function getMessageTimestamp(ts: number | any | null | undefined): Date {
    if (!ts) return new Date();
    
    if (typeof ts === 'number') {
        return new Date(ts * 1000);
    }
    
    // Handle Long objects (from protobuf)
    if (typeof ts === 'object') {
        if (typeof ts.toNumber === 'function') {
            return new Date(ts.toNumber() * 1000);
        }
        if (typeof ts.low === 'number') {
            return new Date(ts.low * 1000);
        }
    }
    
    return new Date();
}