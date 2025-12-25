import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { API_ERRORS } from "./constants";

export type ApiFunction = () => Promise<NextResponse | Response>;

export async function apiHandler(fn: ApiFunction): Promise<NextResponse | Response> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.flatten() },
                { status: 400 }
            );
        }

        console.error("API Error:", error);
        return NextResponse.json(
            { error: API_ERRORS.INTERNAL_SERVER_ERROR },
            { status: 500 }
        );
    }
}
