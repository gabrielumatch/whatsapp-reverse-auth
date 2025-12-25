import { PrismaClient, Prisma } from "@prisma/client";

export class MessageRepository {
    constructor(private prisma: PrismaClient) {}

    async findById(sessionId: string, messageId: string) {
        return this.prisma.message.findUnique({
            where: {
                sessionId_messageId: { sessionId, messageId }
            }
        });
    }

    async create(data: Prisma.MessageUncheckedCreateInput) {
        return this.prisma.message.create({ data });
    }

    async updateStatus(id: string, status: string, messageId?: string) {
        return this.prisma.message.update({
            where: { id },
            data: { 
                status,
                ...(messageId ? { messageId } : {})
            }
        });
    }

    async findPendingOutgoing(sessionId: string) {
        return this.prisma.message.findMany({
            where: {
                sessionId,
                status: "sent",
                isFromMe: true
            },
            include: { chat: true },
            take: 10
        });
    }
}
