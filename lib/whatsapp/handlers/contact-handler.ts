import { BotContext } from "../types";
import { checkRLSError } from "../utils";

/**
 * Syncs profile picture and bio from WhatsApp to Supabase.
 */
export async function syncContact(ctx: BotContext, jid: string, pushName?: string | null) {
    const { supabase, sessionId, sock } = ctx;

    try {
        // 1. Fetch Profile Pic
        let profilePicUrl: string | null = null;
        try {
            profilePicUrl = await sock.profilePictureUrl(jid, "image");
        } catch (err: any) {
            // Silently handle 401/404 - common for privacy settings
        }

        // 2. Fetch Status (About)
        let about: string | null = null;
        try {
            const statusData = await sock.fetchStatus(jid);
            // Safer access for USync result
            if (statusData && Array.isArray(statusData) && statusData.length > 0) {
                const firstResult = statusData[0] as any;
                about = firstResult?.status || null;
            }
        } catch (err: any) {
             // Silently handle 401
        }

        // 3. Upsert into whatsapp_contacts
        const { error: contactError } = await supabase
            .from("whatsapp_contacts")
            .upsert({
                session_id: sessionId,
                jid: jid,
                name: pushName || jid.split("@")[0],
                about: about,
                profile_picture_url: profilePicUrl,
                updated_at: new Date().toISOString()
            }, { onConflict: 'session_id, jid' });

        if (contactError) {
            checkRLSError(contactError);
        }

        // 4. Update whatsapp_chats avatar if available
        if (profilePicUrl) {
            const { error: updateError } = await supabase
                .from("whatsapp_chats")
                .update({ avatar_url: profilePicUrl })
                .eq("session_id", sessionId)
                .eq("jid", jid);
            
            if (updateError) checkRLSError(updateError);
        }

    } catch (e) {
        console.error("Non-critical error syncing contact:", jid, e);
    }
}