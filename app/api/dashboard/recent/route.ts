import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { mapMessageToDto } from "@/lib/mappers";

export async function GET() {
    return apiHandler(async () => {
        const messages = await prisma.message.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            include: { chat: { select: { name: true, jid: true } } }
        });

        const mapped = messages.map(m => ({
            ...mapMessageToDto(m),
            chat_name: m.chat.name || m.chat.jid.split('@')[0]
        }));

        return NextResponse.json(mapped);
    });
}
