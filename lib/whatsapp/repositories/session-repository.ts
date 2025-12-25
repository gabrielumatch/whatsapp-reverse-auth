import { PrismaClient } from "@prisma/client";

export class SessionRepository {
    constructor(private prisma: PrismaClient) {}

    async initialize(sessionId: string) {
        return this.prisma.session.upsert({
            where: { id: sessionId },
            create: { id: sessionId, status: "initializing" },
            update: { status: "initializing" }
        });
    }

    async updateStatus(sessionId: string, status: string, phoneNumber?: string | null) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: { 
                status,
                ...(phoneNumber ? { phoneNumber } : {}),
                ...(status === 'connected' ? { qrCode: null } : {})
            }
        });
    }

    async updateQr(sessionId: string, qr: string) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: { qrCode: qr, status: "connecting" }
        });
    }
}
