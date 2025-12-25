import { BotContext } from "../types";
import { logger } from "@/lib/logger";

export function setupOutgoingMessageListener(ctx: BotContext) {
    const { sessionId, messageRepo, sock } = ctx;

    logger.info({ sessionId }, "Starting outgoing message polling");

    // Poll every 1s for pending outgoing messages
    // Ideally this should use Redis PubSub from API, but for simplicity we poll DB
    setInterval(async () => {
        try {
            const pending = await messageRepo.findPendingOutgoing(sessionId);
            
            for (const msg of pending) {
                if (!msg.chat) continue;

                try {
                    logger.info({ msgId: msg.id, jid: msg.chat.jid }, "Processing outgoing message");

                    // Send via Baileys
                    const sentMsg = await sock.sendMessage(msg.chat.jid, { 
                        text: msg.content || "" 
                    });

                    logger.info({ jid: msg.chat.jid, waId: sentMsg?.key.id }, "Message sent to WhatsApp");

                    // Update Status
                    await messageRepo.updateStatus(msg.id, "delivered", sentMsg?.key.id || undefined);
                } catch (err) {
                    logger.error({ sessionId, msgId: msg.id, err }, "Failed to send message");
                    await messageRepo.updateStatus(msg.id, "failed");
                }
            }
        } catch (err) {
            logger.error({ sessionId, err }, "Error in outgoing polling");
        }
    }, 1000);
}
