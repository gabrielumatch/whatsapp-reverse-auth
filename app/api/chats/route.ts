import { NextRequest, NextResponse } from "next/server";
import { getChats } from "@/lib/data/get-chats";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor"); 

    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    try {
        const chats = await getChats(sessionId, limit, cursor || undefined);
        return NextResponse.json(chats);
    } catch (error) {
        console.error("Chats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}