import { WASocket, proto } from "@whiskeysockets/baileys";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

export type SupabaseClientType = SupabaseClient<Database>;

export interface BotContext {
    sock: WASocket;
    supabase: SupabaseClientType;
    sessionId: string;
}

export interface WebMessage {
    id: string;
    chat_id: string;
    content: string;
    is_from_me: boolean;
    status: string;
    sender_jid: string;
    message_type: string;
    timestamp: string;
}
