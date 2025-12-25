-- Create whatsapp_chats table
create table public.whatsapp_chats (
    id uuid not null default gen_random_uuid(),
    session_id text not null,
    jid text not null,
    name text,
    avatar_url text,
    last_message_at timestamp with time zone default now(),
    unread_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint whatsapp_chats_pkey primary key (id),
    constraint whatsapp_chats_session_jid_unique unique (session_id, jid)
);

-- Create whatsapp_messages table
create table public.whatsapp_messages (
    id uuid not null default gen_random_uuid(),
    chat_id uuid not null references public.whatsapp_chats(id) on delete cascade,
    session_id text not null,
    message_id text, -- WhatsApp message ID
    sender_jid text not null,
    content text,
    message_type text default 'text',
    timestamp timestamp with time zone default now(),
    status text default 'sent', -- sent, delivered, read
    is_from_me boolean default false,
    created_at timestamp with time zone default now(),
    constraint whatsapp_messages_pkey primary key (id),
    constraint whatsapp_messages_session_message_id_unique unique (session_id, message_id)
);

-- Enable Realtime
alter publication supabase_realtime add table public.whatsapp_chats;
alter publication supabase_realtime add table public.whatsapp_messages;

-- RLS (Simple for now, matching existing pattern)
alter table public.whatsapp_chats enable row level security;
alter table public.whatsapp_messages enable row level security;

create policy "Allow all access for now" on public.whatsapp_chats
    for all using (true) with check (true);

create policy "Allow all access for now" on public.whatsapp_messages
    for all using (true) with check (true);
