import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from "@prisma/client";

describe('API: Search', () => {
    let prisma: PrismaClient;
    const TEST_SESSION = "search_test_" + Date.now();

    beforeAll(async () => {
        prisma = new PrismaClient();
        
        // Setup mock data
        const session = await prisma.session.create({ data: { id: TEST_SESSION, status: 'test' } });
        const chat = await prisma.chat.create({ data: { sessionId: TEST_SESSION, jid: 'user1@s.whatsapp.net', name: 'Alice Wonderland' } });
        
        await prisma.message.createMany({
            data: [
                { sessionId: TEST_SESSION, chatId: chat.id, senderJid: 'user1', content: 'Pizza is great', timestamp: new Date() },
                { sessionId: TEST_SESSION, chatId: chat.id, senderJid: 'user1', content: 'Burger is okay', timestamp: new Date() },
            ]
        });
    });

    afterAll(async () => {
        await prisma.session.delete({ where: { id: TEST_SESSION } });
        await prisma.$disconnect();
    });

    it('should find messages containing search query', async () => {
        const query = 'pizza';
        const messages = await prisma.message.findMany({
            where: {
                sessionId: TEST_SESSION,
                content: { contains: query, mode: 'insensitive' }
            }
        });
        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe('Pizza is great');
    });

    it('should find chats by name', async () => {
        const query = 'alice';
        const chats = await prisma.chat.findMany({
            where: {
                sessionId: TEST_SESSION,
                name: { contains: query, mode: 'insensitive' }
            }
        });
        expect(chats.length).toBe(1);
        expect(chats[0].name).toBe('Alice Wonderland');
    });
});
