import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChallengeManager } from '../../lib/auth/challenge-manager';
import { redis } from '@/lib/redis';

// Mock Redis
vi.mock('@/lib/redis', () => ({
    redis: {
        set: vi.fn(),
        get: vi.fn()
    }
}));

describe('ChallengeManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a challenge', async () => {
        const result = await ChallengeManager.create({ userId: 123 });
        
        expect(result.token).toHaveLength(8); // 4 bytes hex = 8 chars
        expect(result.status).toBe('pending');
        expect(result.metadata).toEqual({ userId: 123 });
        
        expect(redis.set).toHaveBeenCalledWith(
            expect.stringContaining('auth:challenge:'),
            expect.any(String),
            'EX',
            600
        );
    });

    it('should verify a valid pending challenge', async () => {
        const token = 'AABBCCDD';
        const mockData = {
            token,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (redis.get as any).mockResolvedValue(JSON.stringify(mockData));

        const result = await ChallengeManager.verify(token, 'user@s.whatsapp.net');

        expect(result).not.toBeNull();
        expect(result?.status).toBe('verified');
        expect(result?.verifiedBy).toBe('user@s.whatsapp.net');
        
        // Should update redis
        expect(redis.set).toHaveBeenCalledWith(
            `auth:challenge:${token}`,
            expect.stringContaining('"status":"verified"'),
            'EX',
            3600
        );
    });

    it('should reject invalid or expired token', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (redis.get as any).mockResolvedValue(null);
        const result = await ChallengeManager.verify('INVALID', 'user@s.whatsapp.net');
        expect(result).toBeNull();
    });

    it('should not re-verify an already verified token', async () => {
        const mockData = {
            token: 'ALREADY',
            status: 'verified',
            verifiedBy: 'other',
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (redis.get as any).mockResolvedValue(JSON.stringify(mockData));

        const result = await ChallengeManager.verify('ALREADY', 'user@s.whatsapp.net');
        
        // Should return existing without update
        expect(result).toEqual(mockData);
        expect(redis.set).not.toHaveBeenCalled();
    });
});
