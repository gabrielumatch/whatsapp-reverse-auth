import { BotContext } from "../types";

export async function getOrCreateChat(
    ctx: BotContext,
    jid: string,
    pushName?: string | null,
    lastMessageText: string = "",
    timestamp?: Date
): Promise<string | null> {
    const { sessionId, chatRepo } = ctx;
    
    const chat = await chatRepo.upsertChat(sessionId, jid, {
        name: pushName || undefined,
        lastMessageContent: lastMessageText,
        timestamp
    });

    return chat.id;
}
