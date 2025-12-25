import { NextRequest, NextResponse } from "next/server";
import { getChats } from "@/lib/data/get-chats";
import { z } from "zod";

const querySchema = z.object({
    sessionId: z.string(),
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = querySchema.safeParse(searchParams);

    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { sessionId, limit, cursor } = result.data;

    try {
        const chats = await getChats(sessionId, limit, cursor);
        return NextResponse.json(chats);
    } catch (error) {
        console.error("Chats API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}