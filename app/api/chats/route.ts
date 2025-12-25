import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Chat } from "@prisma/client";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor"); // lastMessageAt timestamp

    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    try {
        // Raw SQL for performant "Latest Message per Chat"
        // We use a CTE or Lateral Join to get the latest message for each chat
        // Then sort by that message's timestamp
        
        const cursorDate = cursor ? new Date(cursor).toISOString() : null;

        const chats = await prisma.$queryRaw`
            SELECT 
                c.id, 
                c.session_id, 
                c.jid, 
                c.name, 
                c."avatar_url", 
                c."unread_count",
                m.content as last_message_content,
                m.timestamp as last_message_at
            FROM "whatsapp_chats" c
            LEFT JOIN LATERAL (
                SELECT content, timestamp
                FROM "whatsapp_messages" m
                WHERE m.chat_id = c.id
                ORDER BY m.timestamp DESC
                LIMIT 1
            ) m ON true
            WHERE c.session_id = ${sessionId}
            AND (${cursorDate}::timestamp IS NULL OR m.timestamp < ${cursorDate}::timestamp)
            ORDER BY m.timestamp DESC NULLS LAST
            LIMIT ${limit}
        `;

        const mapped = (chats as Chat[]).map(c => ({
            id: c.id,
            session_id: c.sessionId,
            jid: c.jid,
            name: c.name,
            avatar_url: c.avatarUrl,
            last_message_at: c.lastMessageAt,
            last_message_content: c.lastMessageContent,
            unread_count: c.unreadCount || 0
        }));

        return NextResponse.json(mapped);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
