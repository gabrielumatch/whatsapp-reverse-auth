import { PrismaClient, Prisma } from "@prisma/client";

export class ChatRepository {
    constructor(private prisma: PrismaClient) {}

    async findByJid(sessionId: string, jid: string) {
        return this.prisma.chat.findUnique({
            where: {
                sessionId_jid: { sessionId, jid }
            }
        });
    }

    async upsertChat(sessionId: string, jid: string, data: { name?: string; lastMessageContent?: string; timestamp?: Date }) {
        const timestamp = data.timestamp || new Date();
        
        const existing = await this.prisma.chat.findUnique({
            where: { sessionId_jid: { sessionId, jid } }
        });

        if (existing) {
            const isNewer = existing.lastMessageAt ? timestamp > existing.lastMessageAt : true;
            
            const updateData: Prisma.ChatUpdateInput = {};
            
            if (data.name) {
                updateData.name = data.name;
            }
            
            if (isNewer) {
                updateData.lastMessageAt = timestamp;
                updateData.lastMessageContent = data.lastMessageContent;
            }

            if (Object.keys(updateData).length > 0) {
                return this.prisma.chat.update({
                    where: { id: existing.id },
                    data: updateData
                });
            }
            return existing;
        } else {
            return this.prisma.chat.create({
                data: {
                    sessionId,
                    jid,
                    name: data.name || jid.split("@")[0],
                    lastMessageAt: timestamp,
                    lastMessageContent: data.lastMessageContent
                }
            });
        }
    }

    async updateAvatar(sessionId: string, jid: string, avatarUrl: string) {
        return this.prisma.chat.updateMany({
            where: { sessionId, jid },
            data: { avatarUrl }
        });
    }
}