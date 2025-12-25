import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function getActiveSessionId() {
    const cacheKey = "active_session_id";
    
    // 1. Try Cache
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    // 2. Fetch DB
    const session = await prisma.session.findFirst({
        where: { status: 'connected' },
        select: { id: true }
    });
    
    let id = session?.id || null;

    if (!id) {
        const anySession = await prisma.session.findFirst({
            select: { id: true }
        });
        id = anySession?.id || null;
    }

    // 3. Set Cache (30s TTL)
    if (id) {
        await redis.set(cacheKey, id, 'EX', 30);
    }
    
    return id;
}
