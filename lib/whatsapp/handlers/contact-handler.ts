import { BotContext } from "../types";

export async function syncContact(ctx: BotContext, jid: string, pushName?: string | null) {
    const { supabase, sessionId, sock } = ctx;

    try {
        // 1. Fetch Profile Pic
        let profilePicUrl: string | null = null;
        try {
            profilePicUrl = await sock.profilePictureUrl(jid, "image");
        } catch (err) {
            // 401/404 means no profile pic or privacy settings
            // console.log("Failed to fetch profile pic for", jid, err); 
        }

        // 2. Fetch Status (About)
        let about: string | null = null;
        try {
            const statusData = await sock.fetchStatus(jid);
            about = statusData?.status || null;
        } catch (err) {
             // console.log("Failed to fetch status for", jid, err);
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
            console.error("Error upserting contact:", contactError);
        }

        // 4. Update whatsapp_chats avatar if available
        if (profilePicUrl) {
            await supabase
                .from("whatsapp_chats")
                .update({ avatar_url: profilePicUrl })
                .eq("session_id", sessionId)
                .eq("jid", jid);
        }

    } catch (e) {
        console.error("Error syncing contact:", jid, e);
    }
}
