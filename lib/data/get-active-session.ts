import { prisma } from "@/lib/prisma";

export async function getActiveSessionId() {
    const session = await prisma.session.findFirst({
        where: { status: 'connected' },
        select: { id: true }
    });
    
    // If no connected session, fall back to any session (like the hook does)
    if (!session) {
        const anySession = await prisma.session.findFirst({
            select: { id: true }
        });
        return anySession?.id || null;
    }
    
    return session.id;
}
