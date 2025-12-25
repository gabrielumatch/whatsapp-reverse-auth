import { redis } from "@/lib/redis";
import { randomBytes } from "crypto";

export interface ChallengeData {
    token: string;
    status: 'pending' | 'verified' | 'expired';
    createdAt: number;
    expiresAt: number;
    metadata?: Record<string, unknown>;
    verifiedBy?: string; // JID of the user who sent the code
    verifiedAt?: number;
}

const CHALLENGE_PREFIX = "auth:challenge:";
const DEFAULT_TTL_SECONDS = 600; // 10 minutes

/**
 * Manages the lifecycle of "Reverse Auth" challenges using Redis.
 * This is the core logic for generating and verifying OTP-like tokens sent via WhatsApp.
 */
export class ChallengeManager {
    
    /**
     * Creates a new authentication challenge.
     * @param metadata Optional data to attach to the challenge (e.g. userId, ip)
     * @param ttlSeconds Time-to-live in seconds (default: 600)
     */
    static async create(metadata?: Record<string, unknown>, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<ChallengeData> {
        const token = ChallengeManager.generateToken();
        const now = Date.now();
        const expiresAt = now + (ttlSeconds * 1000);

        const data: ChallengeData = {
            token,
            status: 'pending',
            createdAt: now,
            expiresAt,
            metadata
        };

        await redis.set(
            `${CHALLENGE_PREFIX}${token}`,
            JSON.stringify(data),
            'EX',
            ttlSeconds
        );

        return data;
    }

    /**
     * Retrieves a challenge by token.
     */
    static async get(token: string): Promise<ChallengeData | null> {
        const raw = await redis.get(`${CHALLENGE_PREFIX}${token}`);
        if (!raw) return null;
        return JSON.parse(raw) as ChallengeData;
    }

    /**
     * Verifies a challenge with the sender's phone number.
     * Updates the status to 'verified' in Redis.
     * @param token The token received in the message
     * @param senderJid The JID of the WhatsApp user who sent the token
     */
    static async verify(token: string, senderJid: string): Promise<ChallengeData | null> {
        const key = `${CHALLENGE_PREFIX}${token}`;
        const current = await this.get(token);

        if (!current) return null;
        if (current.status !== 'pending') return current; // Already verified

        const updated: ChallengeData = {
            ...current,
            status: 'verified',
            verifiedBy: senderJid,
            verifiedAt: Date.now()
        };

        // Update Redis, extend TTL to 1 hour to ensure the client has time to poll the success state.
        await redis.set(key, JSON.stringify(updated), 'EX', 3600);

        return updated;
    }

    private static generateToken(): string {
        // Generate a friendly, readable token. 
        // 4 bytes hex = 8 chars. e.g. "A1B2C3D4"
        return randomBytes(4).toString('hex').toUpperCase();
    }
}
