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
        const whereClause: any = { sessionId };
        
        if (cursor) {
            whereClause.lastMessageAt = {
                lt: new Date(cursor)
            };
        }

        const chats = await prisma.chat.findMany({
            where: whereClause,
            take: limit,
            orderBy: { lastMessageAt: 'desc' }
        });
// ...

        const mapped = chats.map(c => ({
            id: c.id,
            session_id: c.sessionId,
            jid: c.jid,
            name: c.name,
            avatar_url: c.avatarUrl,
            last_message_at: c.lastMessageAt,
            last_message_content: c.lastMessageContent,
            unread_count: c.unreadCount
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
