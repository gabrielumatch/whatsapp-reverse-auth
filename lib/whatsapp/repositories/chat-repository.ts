import { PrismaClient } from "@prisma/client";

export class ChatRepository {
    constructor(private prisma: PrismaClient) {}

    async findByJid(sessionId: string, jid: string) {
        return this.prisma.chat.findUnique({
            where: {
                sessionId_jid: { sessionId, jid }
            }
        });
    }

    async upsertChat(sessionId: string, jid: string, data: { name?: string; lastMessageContent?: string }) {
        return this.prisma.chat.upsert({
            where: {
                sessionId_jid: { sessionId, jid }
            },
            create: {
                sessionId,
                jid,
                name: data.name || jid.split("@")[0],
                lastMessageAt: new Date(),
                lastMessageContent: data.lastMessageContent
            },
            update: {
                lastMessageAt: new Date(),
                lastMessageContent: data.lastMessageContent,
                ...(data.name ? { name: data.name } : {})
            }
        });
    }

    async updateAvatar(sessionId: string, jid: string, avatarUrl: string) {
        return this.prisma.chat.updateMany({
            where: { sessionId, jid },
            data: { avatarUrl }
        });
    }
}
