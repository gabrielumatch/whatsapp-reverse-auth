import { WASocket, proto } from "@whiskeysockets/baileys";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import * as Minio from "minio";

export interface BotContext {
    sock: WASocket;
    prisma: PrismaClient;
    redis: Redis;
    minio: Minio.Client;
    sessionId: string;
}

export interface WebMessage {
    id: string;
    chatId: string;
    sessionId: string;
    content: string | null;
    isFromMe: boolean;
    status: string;
    senderJid: string;
    messageType: string | null;
    timestamp: Date;
}
