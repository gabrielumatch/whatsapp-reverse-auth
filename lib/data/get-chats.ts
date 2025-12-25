import { prisma } from "@/lib/prisma";

interface RawChat {
    id: string;
    session_id: string;
    jid: string;
    name: string | null;
    avatar_url: string | null;
    unread_count: number | null;
    last_message_content: string | null;
    last_message_at: Date | string | null;
}

export async function getChats(sessionId: string, limit = 20, cursor?: string) {
    const cursorDate = cursor ? new Date(cursor).toISOString() : null;

    const chats = await prisma.$queryRaw<RawChat[]>`
        SELECT 
            c.id, 
            c.session_id, 
            c.jid, 
            c.name, 
            c.avatar_url, 
            c.unread_count,
            m.content as last_message_content,
            m.timestamp as last_message_at
        FROM whatsapp_chats c
        LEFT JOIN LATERAL (
            SELECT content, timestamp
            FROM whatsapp_messages m
            WHERE m.chat_id = c.id
            ORDER BY m.timestamp DESC
            LIMIT 1
        ) m ON true
        WHERE c.session_id = ${sessionId}
        AND (${cursorDate}::timestamp IS NULL OR m.timestamp < ${cursorDate}::timestamp)
        ORDER BY m.timestamp DESC NULLS LAST
        LIMIT ${limit}
    `;

    return chats.map(c => ({
        id: c.id,
        session_id: c.session_id,
        jid: c.jid,
        name: c.name,
        avatar_url: c.avatar_url,
        last_message_at: c.last_message_at,
        last_message_content: c.last_message_content,
        unread_count: c.unread_count || 0
    }));
}
