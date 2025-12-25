import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadAndUploadMedia } from '../../lib/whatsapp/handlers/media-handler';
import * as Baileys from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

// Mock Baileys
vi.mock('@whiskeysockets/baileys', async () => {
    return {
        downloadMediaMessage: vi.fn(),
    };
});

// Mock fs
vi.mock('fs', async () => {
    return {
        default: {
            existsSync: vi.fn(),
            mkdirSync: vi.fn(),
            writeFileSync: vi.fn(),
        }
    };
});

describe('MediaHandler', () => {
    let mockCtx: any;
    let mockMessage: any;

    beforeEach(() => {
        mockCtx = {
            sessionId: 'test_session',
            sock: { logger: { info: vi.fn() } }
        };
        mockMessage = {
            key: { id: 'msg_123' },
            message: {
                imageMessage: { caption: 'test' }
            }
        };
        
        // Reset mocks
        vi.clearAllMocks();
    });

    it('should download and save image message', async () => {
        const mockBuffer = Buffer.from('fake image data');
        (Baileys.downloadMediaMessage as any).mockResolvedValue(mockBuffer);
        (fs.existsSync as any).mockReturnValue(false);

        const result = await downloadAndUploadMedia(mockCtx, mockMessage);

        // Check download call
        expect(Baileys.downloadMediaMessage).toHaveBeenCalled();
        
        // Check fs calls
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('msg_123.jpg'),
            mockBuffer
        );

        // Check return path
        expect(result).toBe('test_session/msg_123.jpg');
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
    });

    it('should handle 404/403 errors silently', async () => {
        const err = { output: { statusCode: 404 } };
        (Baileys.downloadMediaMessage as any).mockRejectedValue(err);
        
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const result = await downloadAndUploadMedia(mockCtx, mockMessage);
        
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Media unavailable'), 404);
        consoleSpy.mockRestore();
    });
});
