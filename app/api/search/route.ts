import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapChatToDto, mapMessageToDto } from "@/lib/mappers";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";

const querySchema = z.object({
    sessionId: z.string(),
    query: z.string().min(1),
});

export async function GET(request: NextRequest) {
    return apiHandler(async () => {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { sessionId, query } = querySchema.parse(searchParams);

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
    });
}
