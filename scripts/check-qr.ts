import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { Database } from "../lib/supabase/database.types";

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase environment variables");
        process.exit(1);
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    const sessionId = "session_yqbebj"; // Your active session

    const { data, error } = await supabase
        .from("whatsapp_sessions_metadata")
        .select("*")
        .eq("session_id", sessionId)
        .single();

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log("Session Data:", data);
    }
}

check();
