/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncContact } from '../../lib/whatsapp/handlers/contact-handler';
import { BotContext } from '../../lib/whatsapp/types';

describe('ContactHandler', () => {
    let mockCtx: BotContext;
    let mockContactRepo: any;
    let mockChatRepo: any;
    let mockSock: any;

    beforeEach(() => {
        mockContactRepo = { upsertContact: vi.fn() };
        mockChatRepo = { updateAvatar: vi.fn() };
        mockSock = {
            profilePictureUrl: vi.fn(),
            fetchStatus: vi.fn()
        };

        mockCtx = {
            sessionId: 'test_session',
            sock: mockSock,
            contactRepo: mockContactRepo,
            chatRepo: mockChatRepo
        } as unknown as BotContext;
    });

    it('should sync contact info successfully', async () => {
        const jid = '123@s.whatsapp.net';
        mockSock.profilePictureUrl.mockResolvedValue('http://pic.url');
        mockSock.fetchStatus.mockResolvedValue([{ status: 'Busy' }]);

        await syncContact(mockCtx, jid, 'John Doe');

        expect(mockContactRepo.upsertContact).toHaveBeenCalledWith('test_session', jid, {
            name: 'John Doe',
            about: 'Busy',
            profilePictureUrl: 'http://pic.url'
        });
        expect(mockChatRepo.updateAvatar).toHaveBeenCalledWith('test_session', jid, 'http://pic.url');
    });

    it('should handle privacy settings (401/404) gracefully', async () => {
        const jid = '123@s.whatsapp.net';
        mockSock.profilePictureUrl.mockRejectedValue(new Error('401 Unauthorized'));
        mockSock.fetchStatus.mockRejectedValue(new Error('401 Unauthorized'));

        await syncContact(mockCtx, jid, null);

        expect(mockContactRepo.upsertContact).toHaveBeenCalledWith('test_session', jid, {
            name: undefined,
            about: undefined,
            profilePictureUrl: undefined
        });
    });
});
