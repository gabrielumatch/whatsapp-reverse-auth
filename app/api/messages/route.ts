import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/data/get-messages";
import { mapMessageToDto } from "@/lib/mappers";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    if (!chatId) {
        return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    try {
        const messages = await getMessages(
            chatId, 
            limit, 
            cursor || undefined, 
            { type: type || undefined, search: search || undefined }
        );
        return NextResponse.json(messages);
    } catch {
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

        return NextResponse.json({ success: true, message: mapMessageToDto(newMessage) });

    } catch (error) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}