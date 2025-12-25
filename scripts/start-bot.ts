import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { startWhatsAppBot } from "../lib/whatsapp/bot";

async function run() {
    const sessionId = process.env.SESSION_ID || "docker_session";
    console.log(`Initializing Bot for session: ${sessionId}`);

    // Initialize Clients
    const prisma = new PrismaClient();
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    
    try {
        await startWhatsAppBot(prisma, redis, sessionId);
    } catch (error) {
        console.error("Failed to start bot:", error);
    }
}

run();
