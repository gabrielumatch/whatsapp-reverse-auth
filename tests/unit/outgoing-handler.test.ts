/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupOutgoingMessageListener } from '../../lib/whatsapp/handlers/outgoing-handler';
import { BotContext } from '../../lib/whatsapp/types';

describe('OutgoingHandler', () => {
    let mockCtx: BotContext;
    let mockMessageRepo: any;
    let mockSock: any;

    beforeEach(() => {
        vi.useFakeTimers();
        mockMessageRepo = {
            findPendingOutgoing: vi.fn(),
            updateStatus: vi.fn()
        };
        mockSock = {
            sendMessage: vi.fn()
        };
        mockCtx = {
            sessionId: 'test_session',
            messageRepo: mockMessageRepo,
            sock: mockSock
        } as unknown as BotContext;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should poll messages and send them', async () => {
        // Mock pending messages
        mockMessageRepo.findPendingOutgoing.mockResolvedValue([
            { id: 'msg_1', content: 'Hello', chat: { jid: 'user@s.whatsapp.net' } }
        ]);
        mockSock.sendMessage.mockResolvedValue({ key: { id: 'wa_id_1' } });

        setupOutgoingMessageListener(mockCtx);

        // Fast-forward time
        await vi.advanceTimersByTimeAsync(1100);

        expect(mockMessageRepo.findPendingOutgoing).toHaveBeenCalled();
        expect(mockSock.sendMessage).toHaveBeenCalledWith('user@s.whatsapp.net', { text: 'Hello' });
        expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith('msg_1', 'delivered', 'wa_id_1');
    });

    it('should handle send failures', async () => {
        mockMessageRepo.findPendingOutgoing.mockResolvedValue([
            { id: 'msg_2', content: 'Fail', chat: { jid: 'user@s.whatsapp.net' } }
        ]);
        mockSock.sendMessage.mockRejectedValue(new Error('Network error'));

        setupOutgoingMessageListener(mockCtx);
        await vi.advanceTimersByTimeAsync(1100);

        expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith('msg_2', 'failed');
    });
});
