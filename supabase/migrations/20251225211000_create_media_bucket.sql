-- Create the bucket
insert into storage.buckets (id, name, public)
values ('whatsapp-media', 'whatsapp-media', false)
on conflict (id) do nothing;

-- Set up RLS for the bucket
-- 1. Allow authenticated users (admins) to select/download
create policy "Authenticated users can select media"
on storage.objects for select
using ( bucket_id = 'whatsapp-media' and auth.role() = 'authenticated' );

-- 2. Allow service role (bot) to insert/upload
create policy "Service role can insert media"
on storage.objects for insert
with check ( bucket_id = 'whatsapp-media' );
