import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get("chatId");

    if (!chatId) {
        return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    try {
        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { timestamp: 'asc' }
        });

        // Map Prisma fields to frontend expected format if needed
        // (Our Prisma schema mostly matches, but let's be safe with camelCase)
        // Actually, Prisma returns camelCase by default (chatId, isFromMe).
        // But our old Supabase frontend expected snake_case (chat_id, is_from_me).
        // I will map them to snake_case to minimize frontend refactoring.
        
        const mapped = messages.map(m => ({
            id: m.id,
            chat_id: m.chatId,
            session_id: m.sessionId,
            sender_jid: m.senderJid,
            content: m.content,
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
