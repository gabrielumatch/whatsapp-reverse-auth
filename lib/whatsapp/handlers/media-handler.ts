import { WAMessage, downloadMediaMessage } from "@whiskeysockets/baileys";
import { BotContext } from "../types";
import { checkRLSError } from "../utils";

export async function downloadAndUploadMedia(ctx: BotContext, m: WAMessage): Promise<string | null> {
    const { supabase, sessionId } = ctx;

    try {
        const messageType = Object.keys(m.message || {})[0];
        // Only handle specific media types
        if (!['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
            return null;
        }

        console.log("Downloading media...", messageType);

        // Download buffer from WhatsApp
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            {}
        );

        if (!buffer) return null;

        // Generate filename
        const ext = getExtension(messageType);
        const filename = `${sessionId}/${m.key.id}.${ext}`;

        // Upload to Supabase
        const { data, error } = await supabase
            .storage
            .from('whatsapp-media')
            .upload(filename, buffer, {
                contentType: getMimeType(messageType),
                upsert: true
            });

        if (error) {
            console.error("Failed to upload media:", error);
            checkRLSError(error);
            return null;
        }

        return data.path; // Return the storage path (e.g. "session_id/msg_id.jpg")

    } catch (err: any) {
        if (err?.output?.statusCode === 403 || err?.output?.statusCode === 404 || err?.output?.statusCode === 410) {
            console.log(`Media unavailable (${messageType}):`, err.output.statusCode);
            return null;
        }
        console.error("Error handling media:", err.message || err);
        return null;
    }
}

function getExtension(type: string): string {
    switch (type) {
        case 'imageMessage': return 'jpg';
        case 'videoMessage': return 'mp4';
        case 'audioMessage': return 'mp3';
        case 'documentMessage': return 'pdf'; // approximation, better to check mimetype
        default: return 'bin';
    }
}

function getMimeType(type: string): string {
    switch (type) {
        case 'imageMessage': return 'image/jpeg';
        case 'videoMessage': return 'video/mp4';
        case 'audioMessage': return 'audio/mpeg';
        case 'documentMessage': return 'application/pdf';
        default: return 'application/octet-stream';
    }
}
