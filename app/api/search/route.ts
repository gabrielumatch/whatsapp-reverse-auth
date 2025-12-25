import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapChatToDto, mapMessageToDto } from "@/lib/mappers";
import { z } from "zod";

const querySchema = z.object({
    sessionId: z.string(),
    query: z.string().min(1),
});

export async function GET(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = querySchema.safeParse(searchParams);

    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { sessionId, query } = result.data;

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
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
