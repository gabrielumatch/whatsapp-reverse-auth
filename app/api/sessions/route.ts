import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

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
