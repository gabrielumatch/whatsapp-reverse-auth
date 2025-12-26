import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { mapMessageToDto } from "@/lib/mappers";
import { connection } from "next/server";

export async function getActiveSessionsCount() {
    await connection();
    return prisma.session.count({ where: { status: 'connected' } });
}

export async function getTotalMessagesCount() {
    await connection();
    return prisma.message.count();
}

export async function getMessagesTodayCount() {
    await connection();
    const today = startOfDay(new Date());
    return prisma.message.count({ where: { createdAt: { gte: today } } });
}

export async function getAuthAttemptsTodayCount() {
    await connection();
    const today = startOfDay(new Date());
    return prisma.authEvent.count({ where: { createdAt: { gte: today } } });
}

export async function getAuthVerifiedTodayCount() {
    await connection();
    const today = startOfDay(new Date());
    return prisma.authEvent.count({ where: { createdAt: { gte: today }, status: 'verified' } });
}

export async function getDashboardActivity() {
    await connection();
    // Fetch last 7 days AUTH activity
    const result = await prisma.$queryRaw<{ date: Date, count: bigint }[]>`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*)::int as count 
        FROM auth_events
        WHERE created_at >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE_TRUNC('day', created_at) 
        ORDER BY date ASC
    `;

    return result.map(r => ({
        date: r.date.toISOString().split('T')[0],
        count: Number(r.count)
    }));
}

export async function getRecentActivity() {
    await connection();
    const messages = await prisma.message.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { chat: { select: { name: true, jid: true } } }
    });

    return messages.map(m => ({
        ...mapMessageToDto(m),
        chat_name: m.chat.name || m.chat.jid.split('@')[0]
    }));
}
