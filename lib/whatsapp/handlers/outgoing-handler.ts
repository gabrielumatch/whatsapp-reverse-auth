import { BotContext } from "../types";

export function setupOutgoingMessageListener(ctx: BotContext) {
    const { sessionId, sock, messageRepo } = ctx;

    console.log("Starting outgoing message polling for session:", sessionId);

    let processing = false;

    setInterval(async () => {
        if (processing) return;
        processing = true;

        try {
            // Fetch pending messages
            const messages = await messageRepo.findPendingOutgoing(sessionId);

            for (const msg of messages) {
                console.log("Processing outgoing message:", msg.id);

                if (msg.chat && msg.chat.jid) {
                    try {
                        // Send via WhatsApp
                        const text = msg.content || "";
                        
                        const sentMsg = await sock.sendMessage(msg.chat.jid, { text });
                        console.log("Message sent to WhatsApp:", msg.chat.jid, sentMsg?.key.id);

                        // Update status
                        await messageRepo.updateStatus(msg.id, "delivered", sentMsg?.key.id || undefined);

                    } catch (err) {
                        console.error("Failed to send message:", err);
                        await messageRepo.updateStatus(msg.id, "failed");
                    }
                } else {
                    console.error("Chat not found for outgoing message:", msg.chatId);
                }
            }

        } catch (err) {
            console.error("Error in outgoing polling:", err);
        } finally {
            processing = false;
        }
    }, 1000); // Poll every second
}
