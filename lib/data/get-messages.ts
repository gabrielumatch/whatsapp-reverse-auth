import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapMessageToDto } from "@/lib/mappers";

export async function getMessages(
    chatId: string, 
    limit = 50, 
    cursor?: string, 
    filters?: { type?: string; search?: string }
) {
    const whereClause: Prisma.MessageWhereInput = { chatId };

    if (filters?.type) {
        whereClause.messageType = filters.type;
    }
    
    if (filters?.search) {
        whereClause.content = {
            contains: filters.search,
            mode: 'insensitive'
        };
    }

    const messages = await prisma.message.findMany({
        where: whereClause,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { timestamp: 'desc' }
    });

    // Match API behavior: Reverse to show oldest -> newest (ASC)
    // NOTE: This might be suboptimal for infinite scroll logic, but we match existing API.
    const reversed = messages.reverse();

    return reversed.map(mapMessageToDto);
}
