import { logger } from "@/lib/logger";

export function handleRlsError(error: unknown) {
    if (String(error).includes("infinite recursion") || String(error).includes("policy violation")) {
        logger.fatal({ err: error }, "CRITICAL: RLS Policy Violation Detected! The bot cannot access the database. Please check RLS policies or Service Role Key.");
        process.exit(1);
    }
}
