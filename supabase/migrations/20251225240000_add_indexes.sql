CREATE INDEX IF NOT EXISTS "whatsapp_chats_session_id_last_message_at_idx" ON "public"."whatsapp_chats" ("session_id", "last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "whatsapp_messages_chat_id_timestamp_idx" ON "public"."whatsapp_messages" ("chat_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "whatsapp_messages_session_id_idx" ON "public"."whatsapp_messages" ("session_id");
