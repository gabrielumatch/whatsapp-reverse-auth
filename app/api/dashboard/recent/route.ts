import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/data/dashboard";
import { apiHandler } from "@/lib/api-handler";
import { connection } from "next/server";

export async function GET() {
    return apiHandler(async () => {
        await connection();
        const data = await getRecentActivity();
        return NextResponse.json(data);
    });
}
