/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleIncomingMessage } from '../../lib/whatsapp/handlers/message-handler';
import { BotContext } from '../../lib/whatsapp/types';

// Mocks
const { mockGetOrCreateChat, mockDownloadAndUploadMedia, mockSyncContact, mockVerifyChallenge } = vi.hoisted(() => ({
    mockGetOrCreateChat: vi.fn(),
    mockDownloadAndUploadMedia: vi.fn(),
    mockSyncContact: vi.fn().mockResolvedValue(undefined),
    mockVerifyChallenge: vi.fn()
}));

vi.mock('../../lib/whatsapp/handlers/chat-handler', () => ({
    getOrCreateChat: mockGetOrCreateChat
}));

vi.mock('../../lib/whatsapp/handlers/media-handler', () => ({
    downloadAndUploadMedia: mockDownloadAndUploadMedia
}));

vi.mock('../../lib/whatsapp/handlers/contact-handler', () => ({
    syncContact: mockSyncContact
}));

vi.mock('@/lib/auth/challenge-manager', () => ({
    ChallengeManager: { verify: mockVerifyChallenge }
}));

describe('MessageHandler', () => {
    let mockCtx: BotContext;
    let mockMessageRepo: any;
    let mockSock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockMessageRepo = {
            findById: vi.fn(),
            create: vi.fn()
        };
        mockSock = {
            user: { id: 'me@s.whatsapp.net' },
            sendMessage: vi.fn()
        };
        mockCtx = {
            sessionId: 'test_session',
            sock: mockSock,
            messageRepo: mockMessageRepo,
            redis: { publish: vi.fn() }
        } as unknown as BotContext;
    });

    it('should verify auth token message', async () => {
        const msg = {
            key: { remoteJid: 'user@s.whatsapp.net', id: 'auth_1', fromMe: false },
            message: { conversation: 'Auth Token: A1B2C3D4' },
            messageTimestamp: 1000
        };
        mockGetOrCreateChat.mockResolvedValue('chat_1');
        mockVerifyChallenge.mockResolvedValue(true); // Verified

        await handleIncomingMessage(mockCtx, msg as any);

        expect(mockVerifyChallenge).toHaveBeenCalledWith('A1B2C3D4', 'user@s.whatsapp.net');
        expect(mockSock.sendMessage).toHaveBeenCalledWith(
            'user@s.whatsapp.net', 
            expect.objectContaining({ text: expect.stringContaining('Authentication successful') })
        );
    });

    it('should ignore messages without content', async () => {
        await handleIncomingMessage(mockCtx, { key: {}, message: undefined });
        expect(mockGetOrCreateChat).not.toHaveBeenCalled();
    });

    it('should process text messages', async () => {
        const msg = {
            key: { remoteJid: 'user@s.whatsapp.net', id: '1', fromMe: false },
            message: { conversation: 'Hello' },
            messageTimestamp: 1000
        };
        mockGetOrCreateChat.mockResolvedValue('chat_1');
        mockMessageRepo.findById.mockResolvedValue(null);
        
        await handleIncomingMessage(mockCtx, msg as any);

        expect(mockGetOrCreateChat).toHaveBeenCalledWith(
            mockCtx, 
            'user@s.whatsapp.net', 
            undefined, // because m.pushName is undefined in mock
            'Hello', 
            expect.any(Date)
        );
        expect(mockMessageRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            content: 'Hello',
            messageType: 'conversation'
        }));
    });

    it('should process image messages', async () => {
        const msg = {
            key: { remoteJid: 'user@s.whatsapp.net', id: '2' },
            message: { imageMessage: { caption: 'Cool pic' } }
        };
        mockGetOrCreateChat.mockResolvedValue('chat_1');
        mockMessageRepo.findById.mockResolvedValue(null);
        mockDownloadAndUploadMedia.mockResolvedValue('path/to/image.jpg');

        await handleIncomingMessage(mockCtx, msg as any);

        expect(mockGetOrCreateChat).toHaveBeenCalledWith(mockCtx, 'user@s.whatsapp.net', undefined, 'Cool pic', expect.any(Date));
        expect(mockDownloadAndUploadMedia).toHaveBeenCalled();
        expect(mockMessageRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            content: 'Cool pic',
            mediaUrl: 'path/to/image.jpg',
            messageType: 'imageMessage'
        }));
    });

    it('should skip duplicate messages', async () => {
        const msg = {
            key: { remoteJid: 'user@s.whatsapp.net', id: '3' },
            message: { conversation: 'Dup' }
        };
        mockGetOrCreateChat.mockResolvedValue('chat_1');
        mockMessageRepo.findById.mockResolvedValue({ id: 'existing' });

        await handleIncomingMessage(mockCtx, msg);

        expect(mockMessageRepo.create).not.toHaveBeenCalled();
    });
});
