/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotContext } from "../types";

/**
 * Syncs profile picture and bio from WhatsApp to Postgres via Prisma.
 */
export async function syncContact(ctx: BotContext, jid: string, pushName?: string | null) {
    const { sessionId, sock, contactRepo, chatRepo } = ctx;

    try {
        // 1. Fetch Profile Pic
        let profilePicUrl: string | null = null;
        try {
            profilePicUrl = (await sock.profilePictureUrl(jid, "image")) || null;
        } catch {
            // Silently handle 401/404
        }

        // 2. Fetch Status (About)
        let about: string | null = null;
        try {
            const statusData: any = await sock.fetchStatus(jid);
            if (statusData) {
                if (Array.isArray(statusData) && statusData.length > 0) {
                    about = typeof statusData[0].status === 'string' ? statusData[0].status : null;
                } else if (typeof statusData.status === 'string') {
                    about = statusData.status;
                }
            }
        } catch {
             // Silently handle 401
        }

        // 3. Upsert into Contact
        await contactRepo.upsertContact(sessionId, jid, {
            name: pushName,
            about,
            profilePictureUrl: profilePicUrl
        });

        // 4. Update Chat Avatar
        if (profilePicUrl) {
            await chatRepo.updateAvatar(sessionId, jid, profilePicUrl);
        }

    } catch (e) {
        console.error("Non-critical error syncing contact:", jid, e);
    }
}