import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapChatToDto, mapMessageToDto } from "@/lib/mappers";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const query = searchParams.get("query");

    if (!sessionId || !query) {
        return NextResponse.json({ error: "Missing sessionId or query" }, { status: 400 });
    }

    try {
        // Search messages
        const messages = await prisma.message.findMany({
            where: {
                sessionId,
                content: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            include: {
                chat: true
            },
            take: 20,
            orderBy: { timestamp: 'desc' }
        });

        // Search chats (names)
        const chats = await prisma.chat.findMany({
            where: {
                sessionId,
                name: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            take: 10
        });

        return NextResponse.json({ 
            messages: messages.map(mapMessageToDto), 
            chats: chats.map(mapChatToDto) 
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
