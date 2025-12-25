import { BotContext, WebMessage } from "../types";

export function setupOutgoingMessageListener(ctx: BotContext) {
    const { supabase, sessionId, sock } = ctx;

    console.log("Subscribing to outgoing messages for session:", sessionId);

    return supabase
        .channel(`bot-sending-${sessionId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "whatsapp_messages",
                filter: `session_id=eq.${sessionId}`,
            },
            async (payload) => {
                const newMsg = payload.new as WebMessage;

                // We only care about messages marked 'sent' (pending) and from 'me'
                if (newMsg.is_from_me && newMsg.status === 'sent') {
                    console.log("Processing outgoing message:", newMsg.id);

                    // 1. Get Chat JID
                    const { data: chat } = await supabase
                        .from("whatsapp_chats")
                        .select("jid")
                        .eq("id", newMsg.chat_id)
                        .single();

                    if (chat && chat.jid) {
                        try {
                            // 2. Send via WhatsApp
                            const sentMsg = await sock.sendMessage(chat.jid, { text: newMsg.content });
                            console.log("Message sent to WhatsApp:", chat.jid, sentMsg?.key.id);

                            // 3. Update status and message_id
                            if (sentMsg?.key.id) {
                                await supabase
                                    .from("whatsapp_messages")
                                    .update({
                                        status: "delivered",
                                        message_id: sentMsg.key.id
                                    })
                                    .eq("id", newMsg.id);
                            }

                        } catch (err) {
                            console.error("Failed to send message:", err);
                            // Optional: Update status to 'failed'
                        }
                    } else {
                        console.error("Chat not found for outgoing message:", newMsg.chat_id);
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log("Outgoing listener status:", status);
        });
}
