import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/auth/register/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        }
    }
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
    }
}));

describe('Auth Registration API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new user successfully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.user.findUnique as any).mockResolvedValue(null); // User doesn't exist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.user.create as any).mockResolvedValue({
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User'
        });

        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                email: 'test@example.com',
                password: 'hashed_password',
                name: 'Test User'
            }
        });
    });

    it('should return 409 if user already exists', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'exists@example.com',
                password: 'password123'
            })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data.error).toBe('User already exists');
    });

    it('should return 400 for invalid email', async () => {
        const req = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'invalid-email',
                password: '123' // too short
            })
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
