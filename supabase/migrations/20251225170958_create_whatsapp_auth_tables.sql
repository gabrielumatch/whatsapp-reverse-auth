create table if not exists public.whatsapp_auth_keys (
    session_id text not null,
    type text not null,
    key_id text not null,
    data text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    primary key (session_id, type, key_id)
);

alter table public.whatsapp_auth_keys enable row level security;

-- Allow access only to authenticated users (admins) or service roles
create policy "Allow full access to authenticated users"
    on public.whatsapp_auth_keys
    for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
