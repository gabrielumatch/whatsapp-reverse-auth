import { BotContext } from "../types";
import { TablesUpdate } from "@/lib/supabase/database.types";
import { checkRLSError } from "../utils";

export async function getOrCreateChat(
    ctx: BotContext,
    jid: string,
    pushName?: string | null,
    lastMessageText: string = ""
): Promise<string | null> {
    const { supabase, sessionId } = ctx;
    
    // 1. Check if chat exists
    const { data: existingChat, error: loadError } = await supabase
        .from("whatsapp_chats")
        .select("*")
        .eq("session_id", sessionId)
        .eq("jid", jid)
        .single();
    
    if (loadError && loadError.code !== 'PGRST116') {
        checkRLSError(loadError);
    }

    if (existingChat) {
        const updatePayload: TablesUpdate<"whatsapp_chats"> = {
            last_message_at: new Date().toISOString(),
            last_message_content: lastMessageText,
        };

        // Only update name if we have a better one from the contact (incoming message)
        // If it's outgoing (pushName is null/undefined usually in our logic), we keep existing name
        if (pushName) {
            updatePayload.name = pushName;
        }

        const { error: updateError } = await supabase
            .from("whatsapp_chats")
            .update(updatePayload)
            .eq("id", existingChat.id);
        
        if (updateError) checkRLSError(updateError);

        return existingChat.id;
    } else {
        // 2. Create new chat
        // If pushName is provided, use it. Otherwise fall back to number.
        const displayName = pushName || jid.split("@")[0];

        const { data: newChat, error: createError } = await supabase
            .from("whatsapp_chats")
            .upsert({
                session_id: sessionId,
                jid: jid,
                name: displayName,
                last_message_at: new Date().toISOString(),
                last_message_content: lastMessageText,
            }, { onConflict: 'session_id, jid' })
            .select()
            .single();

        if (createError) {
            console.error("Error creating chat:", createError);
            checkRLSError(createError);
            return null;
        }
        return newChat.id;
    }
}
