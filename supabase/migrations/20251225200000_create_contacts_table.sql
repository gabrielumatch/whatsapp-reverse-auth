create table public.whatsapp_contacts (
    id uuid default gen_random_uuid() primary key,
    session_id text not null references whatsapp_sessions_metadata(session_id) on delete cascade,
    jid text not null,
    name text,
    about text,
    profile_picture_url text,
    last_seen timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(session_id, jid)
);

-- Enable RLS
alter table public.whatsapp_contacts enable row level security;
create policy "Allow all access for now" on public.whatsapp_contacts for all using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table whatsapp_contacts;
