import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/data/get-messages";
import { mapMessageToDto } from "@/lib/mappers";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";

const getQuerySchema = z.object({
    chatId: z.string().uuid(),
    limit: z.coerce.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
});

const postBodySchema = z.object({
    chat_id: z.string().uuid(),
    session_id: z.string(),
    content: z.string().min(1),
});

export async function GET(request: NextRequest) {
    return apiHandler(async () => {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { chatId, limit, cursor, type, search } = getQuerySchema.parse(searchParams);

        const messages = await getMessages(
            chatId, 
            limit, 
            cursor, 
            { type, search }
        );
        return NextResponse.json(messages);
    });
}

export async function POST(request: NextRequest) {
    return apiHandler(async () => {
        const body = await request.json();
        const { chat_id, session_id, content } = postBodySchema.parse(body);

        // Get Chat to find JID
        const chat = await prisma.chat.findUnique({ where: { id: chat_id } });
        if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

        const newMessage = await prisma.message.create({
            data: {
                chatId: chat_id,
                sessionId: session_id,
                content,
                senderJid: "me", // Placeholder
                isFromMe: true,
                status: "sent",
                messageType: "conversation"
            }
        });

        return NextResponse.json({ success: true, message: mapMessageToDto(newMessage) });
    });
}