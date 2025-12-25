import { NextRequest, NextResponse } from "next/server";
import { getChats } from "@/lib/data/get-chats";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";

const querySchema = z.object({
    sessionId: z.string(),
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
    return apiHandler(async () => {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { sessionId, limit, cursor } = querySchema.parse(searchParams);

        const chats = await getChats(sessionId, limit, cursor);
        return NextResponse.json(chats);
    });
}