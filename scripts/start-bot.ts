import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { startWhatsAppBot } from "../lib/whatsapp/bot";
import { Database } from "../lib/supabase/database.types";

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    let supabaseKey = serviceRoleKey;
    let keyType = "SERVICE_ROLE";

    if (!supabaseKey) {
        if (anonKey) {
            supabaseKey = anonKey;
            keyType = "ANON";
        } else if (publishableKey) {
            supabaseKey = publishableKey;
            keyType = "PUBLISHABLE";
        }
    }

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase environment variables");
        process.exit(1);
    }

    console.log(`Connecting to Supabase using ${keyType} key...`);

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // We use a fixed session ID for the primary bot unless specified
    const sessionId = process.env.SESSION_ID || "primary_bot";
    
    console.log(`Initializing WhatsApp Bot for session: ${sessionId}`);
    
    try {
        await startWhatsAppBot(supabase, sessionId);
    } catch (error) {
        console.error("Failed to start bot:", error);
    }
}

run();
