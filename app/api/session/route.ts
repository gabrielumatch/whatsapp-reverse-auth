import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { connection } from "next/server";

const querySchema = z.object({
    sessionId: z.string().min(1)
});

export async function GET(request: NextRequest) {
    return apiHandler(async () => {
        await connection();
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { sessionId } = querySchema.parse(searchParams);

        const session = await prisma.session.findUnique({
            where: { id: sessionId }
        });

        return NextResponse.json(session || { status: "not_found" });
    });
}