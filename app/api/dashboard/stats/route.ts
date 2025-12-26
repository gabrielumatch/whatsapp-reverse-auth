import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { startOfDay, subDays } from "date-fns";

export async function GET() {
    return apiHandler(async () => {
        const today = startOfDay(new Date());

        const [
            activeSessions,
            totalMessages,
            messagesToday,
            totalContacts
        ] = await Promise.all([
            prisma.session.count({ where: { status: 'connected' } }),
            prisma.message.count(),
            prisma.message.count({ where: { createdAt: { gte: today } } }),
            prisma.contact.count()
        ]);

        return NextResponse.json({
            activeSessions,
            totalMessages,
            messagesToday,
            totalContacts
        });
    });
}
