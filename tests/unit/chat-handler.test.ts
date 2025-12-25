/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateChat } from '../../lib/whatsapp/handlers/chat-handler';

describe('ChatHandler', () => {
    let mockCtx: any;
    let mockChatRepo: any;

    beforeEach(() => {
        mockChatRepo = { upsertChat: vi.fn() };
        mockCtx = {
            sessionId: 'test_session',
            chatRepo: mockChatRepo
        };
    });

    it('should call upsertChat with correct params', async () => {
        const jid = '123@s.whatsapp.net';
        const timestamp = new Date();
        mockChatRepo.upsertChat.mockResolvedValue({ id: 'chat_1' });

        const result = await getOrCreateChat(mockCtx, jid, 'Alice', 'Hello', timestamp);

        expect(mockChatRepo.upsertChat).toHaveBeenCalledWith('test_session', jid, {
            name: 'Alice',
            lastMessageContent: 'Hello',
            timestamp: timestamp
        });
        expect(result).toBe('chat_1');
    });

    it('should handle undefined pushName', async () => {
        const jid = '456@s.whatsapp.net';
        mockChatRepo.upsertChat.mockResolvedValue({ id: 'chat_2' });

        await getOrCreateChat(mockCtx, jid, null, 'Hi');

        expect(mockChatRepo.upsertChat).toHaveBeenCalledWith('test_session', jid, {
            name: undefined,
            lastMessageContent: 'Hi',
            timestamp: undefined
        });
    });
});
