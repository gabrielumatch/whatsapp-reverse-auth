-- Add last_message_content to whatsapp_chats
alter table public.whatsapp_chats add column last_message_content text;
