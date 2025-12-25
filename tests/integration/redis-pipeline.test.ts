import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { MessageProcessor } from "../../lib/whatsapp/workers/message-processor";

describe('Integration: Redis Message Pipeline', () => {
    let prisma: PrismaClient;
    let redis: Redis;
    let processor: MessageProcessor;
    
    const TEST_SESSION = "vitest_session_" + Date.now();
    const TEST_JID = "vitest_user@s.whatsapp.net";

    beforeAll(async () => {
        // Initialize connections
        prisma = new PrismaClient();
        redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
        processor = new MessageProcessor(prisma, redis);

        // Setup Test Data
        await prisma.session.upsert({
            where: { id: TEST_SESSION },
            create: { id: TEST_SESSION, status: "test" },
            update: { status: "test" }
        });

        await prisma.chat.upsert({
            where: { sessionId_jid: { sessionId: TEST_SESSION, jid: TEST_JID } },
            create: { sessionId: TEST_SESSION, jid: TEST_JID, name: "Vitest Bot" },
            update: {}
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.session.delete({ where: { id: TEST_SESSION } });
        await prisma.$disconnect();
        await redis.quit();
    });

    it('should process 200 messages through Redis queue into Postgres', async () => {
        const MESSAGE_COUNT = 200;

        // 1. Enqueue
        for (let i = 1; i <= MESSAGE_COUNT; i++) {
            await processor.enqueue({
                chatId: (await prisma.chat.findUniqueOrThrow({ 
                    where: { sessionId_jid: { sessionId: TEST_SESSION, jid: TEST_JID } } 
                })).id,
                sessionId: TEST_SESSION,
                messageId: `msg_${i}_${Date.now()}`,
                senderJid: TEST_JID,
                content: `Test message ${i}`,
                timestamp: new Date(),
                isFromMe: false,
                status: "delivered"
            });
        }

        // 2. Process (Manually trigger batch processing)
        // We know batch size is 100, so we need 2 passes.
        // We access the private method via cast or just ensure the worker logic works.
        // Since `processBatch` is private, we can either make it public for testing or expose a `flush` method.
        // For testing, we can access it using `any`.
        
        await (processor as any).processBatch(); // Batch 1
        await (processor as any).processBatch(); // Batch 2
        await (processor as any).processBatch(); // Empty check

        // 3. Verify in Postgres
        const count = await prisma.message.count({
            where: { sessionId: TEST_SESSION }
        });

        expect(count).toBe(MESSAGE_COUNT);
        
        // Verify content of one message
        const firstMsg = await prisma.message.findFirst({
            where: { sessionId: TEST_SESSION, content: "Test message 1" }
        });
        expect(firstMsg).toBeDefined();
        expect(firstMsg?.senderJid).toBe(TEST_JID);
    }, 10000); // Increased timeout for DB ops
});
