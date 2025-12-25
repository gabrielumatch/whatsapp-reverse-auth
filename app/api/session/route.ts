import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
    sessionId: z.string().min(1),
});

export async function GET(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = querySchema.safeParse(searchParams);

    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { sessionId } = result.data;

    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId }
        });

        return NextResponse.json(session || { status: "not_found" });
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
