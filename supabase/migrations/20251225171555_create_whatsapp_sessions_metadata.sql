create table if not exists public.whatsapp_sessions_metadata (
    session_id text primary key,
    status text not null default 'disconnected', -- 'connecting', 'connected', 'disconnected'
    qr_code text, -- Base64 QR code or string content
    phone_number text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

alter table public.whatsapp_sessions_metadata enable row level security;

create policy "Allow full access to authenticated users"
    on public.whatsapp_sessions_metadata
    for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
