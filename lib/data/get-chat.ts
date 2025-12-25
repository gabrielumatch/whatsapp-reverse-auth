import { prisma } from "@/lib/prisma";

export async function getChat(chatId: string) {
    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { name: true, jid: true }
    });
    return chat;
}
