import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    if (!chatId) {
        return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    try {
        const messages = await prisma.message.findMany({
            where: { chatId },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { timestamp: 'desc' }
        });

        // Reverse to show oldest -> newest
        const reversed = messages.reverse();

        // Map Prisma fields
        const mapped = reversed.map(m => ({
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

        return NextResponse.json(mapped);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chat_id, session_id, content } = body;

        if (!chat_id || !session_id || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

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

        return NextResponse.json({ success: true, message: newMessage });

    } catch (error) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
