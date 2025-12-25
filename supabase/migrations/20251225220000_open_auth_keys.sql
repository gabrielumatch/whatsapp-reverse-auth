-- Allow anon access to whatsapp_auth_keys (for bot running with Anon key)
create policy "Allow all access to auth keys"
on public.whatsapp_auth_keys
for all
using (true)
with check (true);
