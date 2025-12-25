import { WAMessage, downloadMediaMessage } from "@whiskeysockets/baileys";
import { BotContext } from "../types";
import fs from "fs";
import path from "path";

export async function downloadAndUploadMedia(ctx: BotContext, m: WAMessage): Promise<string | null> {
    const { sessionId } = ctx;
    let messageType = "unknown";

    try {
        messageType = Object.keys(m.message || {})[0];
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
        const fileName = `${m.key.id}.${ext}`;
        const relativeDir = path.join(sessionId);
        const absoluteDir = path.join(process.cwd(), 'storage', 'whatsapp-media', relativeDir);

        // Ensure directory exists
        if (!fs.existsSync(absoluteDir)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
        }

        const absolutePath = path.join(absoluteDir, fileName);
        const relativePath = path.join(relativeDir, fileName).replace(/\\/g, '/');

        // Write to filesystem
        fs.writeFileSync(absolutePath, buffer);

        return relativePath;

    } catch (err: unknown) {
        const error = err as { output?: { statusCode?: number }; message?: string };
        if (error.output?.statusCode === 403 || error.output?.statusCode === 404 || error.output?.statusCode === 410) {
            console.log(`Media unavailable (${messageType}):`, error.output.statusCode);
            return null;
        }
        console.error("Error handling media:", error.message || error);
        return null;
    }
}

function getExtension(type: string): string {
    switch (type) {
        case 'imageMessage': return 'jpg';
        case 'videoMessage': return 'mp4';
        case 'audioMessage': return 'mp3';
        case 'documentMessage': return 'pdf';
        default: return 'bin';
    }
}
