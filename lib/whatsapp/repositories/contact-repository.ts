import { PrismaClient } from "@prisma/client";

export class ContactRepository {
    constructor(private prisma: PrismaClient) {}

    async upsertContact(sessionId: string, jid: string, data: {
        name?: string | null;
        about?: string | null;
        profilePictureUrl?: string | null;
    }) {
        return this.prisma.contact.upsert({
            where: {
                sessionId_jid: { sessionId, jid }
            },
            update: {
                ...(data.name ? { name: data.name } : {}),
                ...(data.about ? { about: data.about } : {}),
                ...(data.profilePictureUrl ? { profilePictureUrl: data.profilePictureUrl } : {})
            },
            create: {
                sessionId,
                jid,
                name: data.name || jid.split("@")[0],
                about: data.about,
                profilePictureUrl: data.profilePictureUrl
            }
        });
    }
}
