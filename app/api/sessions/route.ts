import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { connection } from "next/server";

const deleteSchema = z.object({
    sessionId: z.string().min(1),
});

export async function GET() {
    return apiHandler(async () => {
        await connection();
        const sessions = await prisma.session.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(sessions);
    });
}

export async function DELETE(request: NextRequest) {
    return apiHandler(async () => {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { sessionId } = deleteSchema.parse(searchParams);

        await prisma.session.delete({
            where: { id: sessionId }
        });
        return NextResponse.json({ success: true });
    });
}
