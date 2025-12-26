import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { z } from "zod";
import { ChallengeManager } from "@/lib/auth/challenge-manager";
import { getActiveSessionId } from "@/lib/data/get-active-session";
import { prisma } from "@/lib/prisma";

const createChallengeSchema = z.object({
    metadata: z.record(z.string(), z.any()).optional(),
    ttl: z.number().min(60).max(3600).optional(), // 1 min to 1 hour
});

const getChallengeSchema = z.object({
    token: z.string().min(8),
});

export async function GET(request: NextRequest) {
    return apiHandler(async () => {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const { token } = getChallengeSchema.parse(searchParams);

        const challenge = await ChallengeManager.get(token);

        if (!challenge) {
            return NextResponse.json({ error: "Challenge not found or expired" }, { status: 404 });
        }

        return NextResponse.json(challenge);
    });
}

export async function POST(request: NextRequest) {
    return apiHandler(async () => {
        const body = await request.json();
        const { metadata, ttl } = createChallengeSchema.parse(body);

        const challenge = await ChallengeManager.create(metadata, ttl);

        // Fetch active bot number to construct URL
        const sessionId = await getActiveSessionId();
        let phoneNumber = null;
        
        if (sessionId) {
            const session = await prisma.session.findUnique({ 
                where: { id: sessionId },
                select: { phoneNumber: true }
            });
            phoneNumber = session?.phoneNumber;
        }

        const messageText = `Auth Token: ${challenge.token}`;
        const whatsappUrl = phoneNumber 
            ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`
            : null;

        return NextResponse.json({
            ...challenge,
            whatsapp_url: whatsappUrl,
            bot_number: phoneNumber,
            instructions: `Send the message '${messageText}' to our WhatsApp bot.`
        });
    });
}
