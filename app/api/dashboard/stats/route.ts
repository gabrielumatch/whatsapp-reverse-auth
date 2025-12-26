import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { startOfDay } from "date-fns";

export async function GET() {
    return apiHandler(async () => {
        const today = startOfDay(new Date());

        const [
            activeSessions,
            totalMessages,
            messagesToday,
            authAttemptsToday,
            authVerifiedToday
        ] = await Promise.all([
            prisma.session.count({ where: { status: 'connected' } }),
            prisma.message.count(),
            prisma.message.count({ where: { createdAt: { gte: today } } }),
            prisma.authEvent.count({ where: { createdAt: { gte: today } } }),
            prisma.authEvent.count({ where: { createdAt: { gte: today }, status: 'verified' } })
        ]);

        return NextResponse.json({
            activeSessions,
            totalMessages,
            messagesToday,
            totalContacts: 0, // Deprecated or remove if unused, keeping for structure compatibility if needed, else remove
            authAttemptsToday,
            authVerifiedToday
        });
    });
}
