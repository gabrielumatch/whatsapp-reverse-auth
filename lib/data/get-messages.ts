import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getMessages(chatId: string, limit = 50, cursor?: string) {
    const whereClause: Prisma.MessageWhereInput = { chatId };

    const messages = await prisma.message.findMany({
        where: whereClause,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { timestamp: 'desc' }
    });

    // Match API behavior: Reverse to show oldest -> newest (ASC)
    // NOTE: This might be suboptimal for infinite scroll logic, but we match existing API.
    const reversed = messages.reverse();

    return reversed.map(m => ({
        id: m.id,
        chat_id: m.chatId,
        session_id: m.sessionId,
        sender_jid: m.senderJid,
        content: m.content,
        caption: m.caption,
        media_url: m.mediaUrl,
        message_type: m.messageType,
        timestamp: m.timestamp,
        status: m.status,
        is_from_me: m.isFromMe
    }));
}
