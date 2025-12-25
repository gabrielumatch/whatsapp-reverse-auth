import { BotContext } from "../types";
import { TablesUpdate } from "@/lib/supabase/database.types";

export async function getOrCreateChat(
    ctx: BotContext,
    jid: string,
    pushName?: string | null,
    lastMessageText: string = ""
): Promise<string | null> {
    const { supabase, sessionId, sock } = ctx;
    
    // 1. Check if chat exists
    const { data: existingChat } = await supabase
        .from("whatsapp_chats")
        .select("*")
        .eq("session_id", sessionId)
        .eq("jid", jid)
        .single();

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

        await supabase
            .from("whatsapp_chats")
            .update(updatePayload)
            .eq("id", existingChat.id);

        return existingChat.id;
    } else {
        // 2. Create new chat
        // If pushName is provided, use it. Otherwise fall back to number.
        const displayName = pushName || jid.split("@")[0];

        const { data: newChat, error: createError } = await supabase
            .from("whatsapp_chats")
            .insert({
                session_id: sessionId,
                jid: jid,
                name: displayName,
                last_message_at: new Date().toISOString(),
                last_message_content: lastMessageText,
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating chat:", createError);
            return null;
        }
        return newChat.id;
    }
}
