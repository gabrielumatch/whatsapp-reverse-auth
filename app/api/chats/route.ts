import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        // Map fields to match frontend expectation (snake_case from raw query might need manual mapping if type is lost)
        const mapped = (chats as any[]).map(c => ({
            id: c.id,
            session_id: c.session_id,
            jid: c.jid,
            name: c.name,
            avatar_url: c.avatar_url,
            last_message_at: c.last_message_at,
            last_message_content: c.last_message_content,
            unread_count: c.unread_count || 0
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
