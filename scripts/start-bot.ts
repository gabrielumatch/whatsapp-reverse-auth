import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { startWhatsAppBot } from "../lib/whatsapp/bot";
import { Database } from "../lib/supabase/database.types";

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase environment variables");
        process.exit(1);
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // We use a fixed session ID for the primary bot
    const sessionId = "primary_bot";
    
    console.log(`Initializing WhatsApp Bot for session: ${sessionId}`);
    
    try {
        await startWhatsAppBot(supabase, sessionId);
    } catch (error) {
        console.error("Failed to start bot:", error);
    }
}

run();
