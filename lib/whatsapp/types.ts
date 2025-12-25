import { WASocket } from "@whiskeysockets/baileys";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { SessionRepository } from "./repositories/session-repository";
import { ChatRepository } from "./repositories/chat-repository";
import { MessageRepository } from "./repositories/message-repository";
import { ContactRepository } from "./repositories/contact-repository";
import { MessageProcessor } from "./workers/message-processor";

export interface BotContext {
    sock: WASocket;
    prisma: PrismaClient;
    redis: Redis;
    sessionId: string;
    
    // Repositories
    sessionRepo: SessionRepository;
    chatRepo: ChatRepository;
    messageRepo: MessageRepository;
    contactRepo: ContactRepository;
    
    // Workers
    messageProcessor: MessageProcessor;
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
