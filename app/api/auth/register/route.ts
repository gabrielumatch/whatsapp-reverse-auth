import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { apiHandler } from "@/lib/api-handler";

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

export async function POST(request: NextRequest) {
    return apiHandler(async () => {
        const body = await request.json();
        const { email, password, name } = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name } 
        });
    });
}
