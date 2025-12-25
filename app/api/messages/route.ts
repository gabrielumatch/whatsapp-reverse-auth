import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/data/get-messages";
import { mapMessageToDto } from "@/lib/mappers";
import { z } from "zod";

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
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = getQuerySchema.safeParse(searchParams);

    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { chatId, limit, cursor, type, search } = result.data;

    try {
        const messages = await getMessages(
            chatId, 
            limit, 
            cursor, 
            { type, search }
        );
        return NextResponse.json(messages);
    } catch (error) {
        console.error("Messages GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = postBodySchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { chat_id, session_id, content } = result.data;

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

    } catch (error) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}