/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from "@prisma/client";
import { ChatRepository } from "../../lib/whatsapp/repositories/chat-repository";
import { MessageRepository } from "../../lib/whatsapp/repositories/message-repository";
import { SessionRepository } from "../../lib/whatsapp/repositories/session-repository";

describe('Integration: Repositories', () => {
    let prisma: PrismaClient;
    let chatRepo: ChatRepository;
    let messageRepo: MessageRepository;
    let sessionRepo: SessionRepository;
    
    const TEST_SESSION = "repo_test_session_" + Date.now();
    const TEST_JID = "repo_user@s.whatsapp.net";

    beforeAll(async () => {
        prisma = new PrismaClient();
        chatRepo = new ChatRepository(prisma);
        messageRepo = new MessageRepository(prisma);
        sessionRepo = new SessionRepository(prisma);

        // Init Session
        await sessionRepo.initialize(TEST_SESSION);
    });

    afterAll(async () => {
        await prisma.session.delete({ where: { id: TEST_SESSION } });
        await prisma.$disconnect();
    });

    it('SessionRepo: should update status', async () => {
        await sessionRepo.updateStatus(TEST_SESSION, 'connected', '123456');
        const session = await prisma.session.findUnique({ where: { id: TEST_SESSION } });
        expect(session?.status).toBe('connected');
        expect(session?.phoneNumber).toBe('123456');
    });

    it('ChatRepo: should upsert chat and handle timestamp logic', async () => {
        const oldDate = new Date('2023-01-01');
        const newDate = new Date('2024-01-01');

        // 1. Create with Old Date
        await chatRepo.upsertChat(TEST_SESSION, TEST_JID, {
            name: 'Old Name',
            lastMessageContent: 'Old Msg',
            timestamp: oldDate
        });

        let chat = await prisma.chat.findUnique({ where: { sessionId_jid: { sessionId: TEST_SESSION, jid: TEST_JID } } });
        expect(chat?.lastMessageContent).toBe('Old Msg');
        expect(chat?.lastMessageAt).toEqual(oldDate);

        // 2. Update with New Date (Should Update)
        await chatRepo.upsertChat(TEST_SESSION, TEST_JID, {
            name: 'New Name',
            lastMessageContent: 'New Msg',
            timestamp: newDate
        });

        chat = await prisma.chat.findUnique({ where: { sessionId_jid: { sessionId: TEST_SESSION, jid: TEST_JID } } });
        expect(chat?.lastMessageContent).toBe('New Msg'); // Updated
        expect(chat?.name).toBe('New Name');

        // 3. Update with OLDER Date (Should NOT Update Content)
        await chatRepo.upsertChat(TEST_SESSION, TEST_JID, {
            lastMessageContent: 'Ancient Msg',
            timestamp: oldDate
        });

        chat = await prisma.chat.findUnique({ where: { sessionId_jid: { sessionId: TEST_SESSION, jid: TEST_JID } } });
        expect(chat?.lastMessageContent).toBe('New Msg'); // Should stay New
    });

    it('ChatList Query (Raw SQL): should return latest message per chat', async () => {
        // Create 2 messages
        await messageRepo.create({
            chatId: (await chatRepo.findByJid(TEST_SESSION, TEST_JID))!.id,
            sessionId: TEST_SESSION,
            senderJid: TEST_JID,
            content: 'Msg 1',
            timestamp: new Date('2024-01-01T10:00:00Z')
        });

        await messageRepo.create({
            chatId: (await chatRepo.findByJid(TEST_SESSION, TEST_JID))!.id,
            sessionId: TEST_SESSION,
            senderJid: TEST_JID,
            content: 'Msg 2 (Latest)',
            timestamp: new Date('2024-01-01T10:01:00Z')
        });

        // Run the Query manually (mocking what API does)
        const chats: any[] = await prisma.$queryRaw`
            SELECT m.content as last_message_content
            FROM "whatsapp_chats" c
            LEFT JOIN LATERAL (
                SELECT content
                FROM "whatsapp_messages" m
                WHERE m.chat_id = c.id
                ORDER BY m.timestamp DESC
                LIMIT 1
            ) m ON true
            WHERE c.session_id = ${TEST_SESSION}
        `;

        expect(chats.length).toBe(1);
        expect(chats[0].last_message_content).toBe('Msg 2 (Latest)');
    });

    it('MessageRepo: should find pending outgoing messages', async () => {
        // Create outgoing message
        await messageRepo.create({
            chatId: (await chatRepo.findByJid(TEST_SESSION, TEST_JID))!.id,
            sessionId: TEST_SESSION,
            senderJid: 'me',
            content: 'Outgoing',
            status: 'sent',
            isFromMe: true
        });

        const pending = await messageRepo.findPendingOutgoing(TEST_SESSION);
        expect(pending.length).toBe(1);
        expect(pending[0].content).toBe('Outgoing');
    });
});
