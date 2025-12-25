import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";

export class MessageProcessor {
    private isProcessing = false;
    private BATCH_SIZE = parseInt(process.env.MESSAGE_BATCH_SIZE || "100");
    private POLL_INTERVAL = parseInt(process.env.MESSAGE_POLL_INTERVAL_MS || "500");
    private QUEUE_KEY = "queue:messages";

    constructor(
        private prisma: PrismaClient,
        private redis: Redis
    ) {}

    async start() {
        console.log(`Starting Message Processor Worker (Batch: ${this.BATCH_SIZE}, Interval: ${this.POLL_INTERVAL}ms)...`);
        // Poll based on config
        setInterval(() => this.processBatch(), this.POLL_INTERVAL);
    }

    private async processBatch() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // 1. Fetch batch from Redis
            // LPOP count is supported in Redis 6.2+. If older, use pipeline or lrange/ltrim.
            // ioredis supports lpop with count.
            const rawMessages = await this.redis.lpop(this.QUEUE_KEY, this.BATCH_SIZE);
            
            if (!rawMessages || (Array.isArray(rawMessages) && rawMessages.length === 0)) {
                this.isProcessing = false;
                return;
            }

            const messages = (Array.isArray(rawMessages) ? rawMessages : [rawMessages])
                .map(s => JSON.parse(s));

            if (messages.length > 0) {
                console.log(`Processing batch of ${messages.length} messages...`);
                
                // 2. Bulk Insert
                // We use createMany for speed. `skipDuplicates` handles re-syncs.
                // Note: This requires all `chatId`s to exist. 
                // Our handler ensures chat creation BEFORE pushing to queue.
                await this.prisma.message.createMany({
                    data: messages,
                    skipDuplicates: true
                });
            }

        } catch (error) {
            console.error("Error processing message batch:", error);
            // Ideally, push back to queue or dead-letter queue
        } finally {
            this.isProcessing = false;
        }
    }

    async enqueue(messageData: Record<string, unknown>) {
        await this.redis.rpush(this.QUEUE_KEY, JSON.stringify(messageData));
    }
}
