import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../../app/api/auth/challenge/route';
import { NextRequest } from 'next/server';
import { ChallengeManager } from '../../lib/auth/challenge-manager';

// Mock ChallengeManager
vi.mock('@/lib/auth/challenge-manager', () => ({
    ChallengeManager: {
        create: vi.fn(),
        get: vi.fn()
    }
}));

// Mock Database Helper
vi.mock('@/lib/data/get-active-session', () => ({
    getActiveSessionId: vi.fn().mockResolvedValue('session_123')
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        session: {
            findUnique: vi.fn().mockResolvedValue({ phoneNumber: '5511999999999' })
        }
    }
}));

describe('Auth API Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST should create a challenge', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ChallengeManager.create as any).mockResolvedValue({
            token: 'ABC12345',
            status: 'pending',
            expiresAt: Date.now() + 60000
        });

        const req = new NextRequest('http://localhost/api/auth/challenge', {
            method: 'POST',
            body: JSON.stringify({ metadata: { userId: 1 } })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.token).toBe('ABC12345');
        expect(data.whatsapp_url).toContain('5511999999999');
        expect(data.whatsapp_url).toContain('ABC12345');
    });

    it('GET should retrieve a challenge', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ChallengeManager.get as any).mockResolvedValue({
            token: 'ABC12345',
            status: 'verified'
        });

        const req = new NextRequest('http://localhost/api/auth/challenge?token=ABC12345');
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.status).toBe('verified');
    });

    it('GET should return 404 for invalid token', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ChallengeManager.get as any).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/auth/challenge?token=INVALID_TOKEN');
        const res = await GET(req);

        expect(res.status).toBe(404);
    });
});
