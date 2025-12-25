/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadAndUploadMedia } from '../../lib/whatsapp/handlers/media-handler';
import { BotContext } from '../../lib/whatsapp/types';
import * as Baileys from '@whiskeysockets/baileys';
import fs from 'fs';
import { logger } from '@/lib/logger';

// Mock Logger
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('@whiskeysockets/baileys', async () => {
    const actual = await vi.importActual('@whiskeysockets/baileys');
    return {
        ...actual,
        downloadMediaMessage: vi.fn()
    };
});

vi.mock('fs', async () => ({
    default: {
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        promises: {
            writeFile: vi.fn()
        }
    }
}));

describe('MediaHandler', () => {
    let mockCtx: BotContext;
    let mockMessage: any;
    const mockBuffer = Buffer.from('fake-image');

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = { sessionId: 'test_session' } as BotContext;
        mockMessage = {
            key: { id: 'msg_123' },
            message: { imageMessage: { url: 'http://...' } }
        };
        // Mock fs
        (fs.existsSync as any).mockReturnValue(false);
    });

    it('should download and save image message', async () => {
        (Baileys.downloadMediaMessage as any).mockResolvedValue(mockBuffer);

        const result = await downloadAndUploadMedia(mockCtx, mockMessage);

        expect(Baileys.downloadMediaMessage).toHaveBeenCalled();
        expect(result).toBe('/test_session/msg_123.jpg');
        
        // Check fs calls
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('msg_123.jpg'),
            mockBuffer
        );
    });

    it('should ignore non-media messages', async () => {
        mockMessage.message = { conversation: 'Hello' };
        
        const result = await downloadAndUploadMedia(mockCtx, mockMessage);
        
        expect(result).toBeNull();
        expect(Baileys.downloadMediaMessage).not.toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
        (Baileys.downloadMediaMessage as any).mockRejectedValue(new Error('Download failed'));

        const result = await downloadAndUploadMedia(mockCtx, mockMessage);

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalled();
    });

    it('should handle 404/403 errors silently', async () => {
        const error: any = new Error('Not Found');
        error.output = { statusCode: 404 };
        (Baileys.downloadMediaMessage as any).mockRejectedValue(error);

        const result = await downloadAndUploadMedia(mockCtx, mockMessage);

        expect(result).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 }), 
            expect.stringContaining("Media unavailable")
        );
    });
});
