import { WAMessage, downloadMediaMessage } from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs";
import { BotContext } from "../types";
import { logger } from "@/lib/logger";

export async function downloadAndUploadMedia(ctx: BotContext, m: WAMessage): Promise<string | null> {
    const { sessionId } = ctx;
    const msgType = Object.keys(m.message || {})[0];

    if (!m.message) return null;

    const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
    if (!supportedTypes.includes(msgType)) {
        return null;
    }

    try {
        logger.info({ sessionId, msgType }, "Downloading media");
        
        // This helper handles decryption
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            {}
        );

        if (!buffer) {
            return null;
        }

        // Save to Local Filesystem
        const mediaDir = path.join(process.cwd(), 'storage', 'whatsapp-media', sessionId);
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        // Generate Filename
        const ext = getExtension(msgType);
        const fileName = `${m.key.id}.${ext}`;
        const filePath = path.join(mediaDir, fileName);

        await fs.promises.writeFile(filePath, buffer);

        // Return relative path for API access
        // We will serve this via /api/media/[sessionId]/[messageId].ext
        return `/${sessionId}/${fileName}`;

    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'output' in error) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const output = (error as any).output;
             if (output?.statusCode === 404 || output?.statusCode === 410) {
                 logger.warn({ sessionId, statusCode: output.statusCode, msgType }, "Media unavailable");
                 return null;
             }
        }
        logger.error({ sessionId, err: error }, "Error handling media");
        return null;
    }
}

function getExtension(type: string): string {
    switch (type) {
        case 'imageMessage': return 'jpg';
        case 'videoMessage': return 'mp4';
        case 'audioMessage': return 'mp3';
        case 'documentMessage': return 'pdf'; // Simplified, should parse mimetype
        case 'stickerMessage': return 'webp';
        default: return 'bin';
    }
}
