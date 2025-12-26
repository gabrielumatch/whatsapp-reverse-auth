import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getStats } from '../../app/api/dashboard/stats/route';
import { GET as getActivity } from '../../app/api/dashboard/activity/route';
import { GET as getRecent } from '../../app/api/dashboard/recent/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        session: { count: vi.fn() },
        message: { count: vi.fn(), findMany: vi.fn() },
        contact: { count: vi.fn() },
        authEvent: { count: vi.fn() },
        $queryRaw: vi.fn()
    }
}));

// Mock next/server connection
vi.mock('next/server', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next/server')>();
    return {
        ...actual,
        connection: vi.fn().mockResolvedValue(undefined),
    };
});

describe('Dashboard API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /stats should return aggregated counts', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.session.count as any).mockResolvedValue(5);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.message.count as any).mockResolvedValue(100); // For both total and today calls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.authEvent.count as any).mockResolvedValue(20); // For both total and verified calls

        const res = await getStats();
        const data = await res.json();

        expect(data).toMatchObject({
            activeSessions: 5,
            totalMessages: 100,
            messagesToday: 100,
            authAttemptsToday: 20,
            authVerifiedToday: 20
        });
    });

    it('GET /activity should return chart data', async () => {
        const mockData = [
            { date: new Date('2024-01-01'), count: BigInt(10) },
            { date: new Date('2024-01-02'), count: BigInt(20) }
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.$queryRaw as any).mockResolvedValue(mockData);

        const res = await getActivity();
        const data = await res.json();

        expect(data).toHaveLength(2);
        expect(data[0].date).toBe('2024-01-01');
        expect(data[0].count).toBe(10);
    });

    it('GET /recent should return recent messages', async () => {
        const mockMessages = [
            { 
                id: '1', 
                content: 'Hello', 
                timestamp: new Date(), 
                chat: { name: 'User 1', jid: '123@s.whatsapp.net' } 
            }
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.message.findMany as any).mockResolvedValue(mockMessages);

        const res = await getRecent();
        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0].content).toBe('Hello');
        expect(data[0].chat_name).toBe('User 1');
    });
});
