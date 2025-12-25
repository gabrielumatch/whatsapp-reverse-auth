import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deleteSchema = z.object({
    sessionId: z.string().min(1),
});

export async function GET() {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(sessions);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = deleteSchema.safeParse(searchParams);

    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { sessionId } = result.data;

    try {
        await prisma.session.delete({
            where: { id: sessionId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Session Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
