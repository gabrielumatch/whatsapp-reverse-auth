import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export async function GET() {
    return apiHandler(async () => {
        // Fetch last 7 days AUTH activity
        const result = await prisma.$queryRaw<{ date: Date, count: bigint }[]>`
            SELECT DATE_TRUNC('day', created_at) as date, COUNT(*)::int as count 
            FROM auth_events
            WHERE created_at >= NOW() - INTERVAL '7 days' 
            GROUP BY DATE_TRUNC('day', created_at) 
            ORDER BY date ASC
        `;

        const chartData = result.map(r => ({
            date: r.date.toISOString().split('T')[0], // YYYY-MM-DD
            count: Number(r.count)
        }));

        return NextResponse.json(chartData);
    });
}
