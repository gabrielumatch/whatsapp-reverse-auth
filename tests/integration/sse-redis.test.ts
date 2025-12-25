import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Redis from "ioredis";

describe('Integration: Redis SSE Pub/Sub', () => {
    let publisher: Redis;
    let subscriber: Redis;
    
    const TEST_CHAT_ID = "test-chat-uuid";

    beforeAll(async () => {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        publisher = new Redis(redisUrl);
        subscriber = new Redis(redisUrl);
    });

    afterAll(async () => {
        await publisher.quit();
        await subscriber.quit();
    });

    it('should receive a message via Redis Pub/Sub channel', () => {
        return new Promise<void>(async (resolve, reject) => {
            const channel = `updates:chat:${TEST_CHAT_ID}`;
            const testData = { id: '123', content: 'hello sse' };

            // Set up subscriber
            subscriber.on('message', (chan, message) => {
                try {
                    if (chan === channel) {
                        const parsed = JSON.parse(message);
                        expect(parsed.content).toBe(testData.content);
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            });

            try {
                await subscriber.subscribe(channel);
                // Publish after subscription is active
                await publisher.publish(channel, JSON.stringify(testData));
            } catch (err) {
                reject(err);
            }
        });
    });

    it('should receive a chat update via Redis Pub/Sub channel', () => {
        return new Promise<void>(async (resolve, reject) => {
            const TEST_SESSION_ID = "test-session-uuid";
            const channel = `updates:session:${TEST_SESSION_ID}`;
            const testData = { id: 'chat-1', name: 'New Chat', lastMessageContent: 'Hello' };

            // Set up subscriber
            subscriber.on('message', (chan, message) => {
                try {
                    if (chan === channel) {
                        const parsed = JSON.parse(message);
                        expect(parsed.name).toBe(testData.name);
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            });

            try {
                await subscriber.subscribe(channel);
                // Publish after subscription is active
                await publisher.publish(channel, JSON.stringify(testData));
            } catch (err) {
                reject(err);
            }
        });
    });
});