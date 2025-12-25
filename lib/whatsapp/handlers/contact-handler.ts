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
            const statusData = await sock.fetchStatus(jid);
            if (statusData && Array.isArray(statusData) && statusData.length > 0) {
                const firstResult = statusData[0] as { status?: string };
                about = firstResult?.status || null;
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