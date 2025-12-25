-- cleanup orphans
DELETE FROM public.whatsapp_auth_keys 
WHERE session_id NOT IN (SELECT session_id FROM public.whatsapp_sessions_metadata);

DELETE FROM public.whatsapp_chats 
WHERE session_id NOT IN (SELECT session_id FROM public.whatsapp_sessions_metadata);

DELETE FROM public.whatsapp_messages 
WHERE session_id NOT IN (SELECT session_id FROM public.whatsapp_sessions_metadata);

-- Add FK to whatsapp_auth_keys
ALTER TABLE public.whatsapp_auth_keys
ADD CONSTRAINT whatsapp_auth_keys_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES public.whatsapp_sessions_metadata(session_id)
ON DELETE CASCADE;

-- Add FK to whatsapp_chats
ALTER TABLE public.whatsapp_chats
ADD CONSTRAINT whatsapp_chats_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES public.whatsapp_sessions_metadata(session_id)
ON DELETE CASCADE;

-- Add FK to whatsapp_messages
ALTER TABLE public.whatsapp_messages
ADD CONSTRAINT whatsapp_messages_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES public.whatsapp_sessions_metadata(session_id)
ON DELETE CASCADE;
