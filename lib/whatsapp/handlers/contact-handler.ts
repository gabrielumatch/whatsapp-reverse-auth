import { BotContext } from "../types";
import { logger } from "@/lib/logger";

export async function syncContact(ctx: BotContext, jid: string, pushName?: string | null) {
    const { sessionId, sock, contactRepo, chatRepo } = ctx;

    try {
        let profilePictureUrl: string | undefined;
        let about: string | undefined;

        try {
            profilePictureUrl = await sock.profilePictureUrl(jid, "image");
        } catch {
            // Ignore 401/404
        }

        try {
            // fetchStatus returns USyncQueryResultList[]
            const status = await sock.fetchStatus(jid);
            if (Array.isArray(status) && status.length > 0) {
                const s = status[0].status;
                about = typeof s === 'string' ? s : undefined;
            }
        } catch {
            // Ignore
        }

        await contactRepo.upsertContact(sessionId, jid, {
            name: pushName || undefined,
            about,
            profilePictureUrl
        });

        if (profilePictureUrl) {
            await chatRepo.updateAvatar(sessionId, jid, profilePictureUrl);
        }

    } catch (e) {
        logger.warn({ jid, err: e }, "Non-critical error syncing contact");
    }
}
