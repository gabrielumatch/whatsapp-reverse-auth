-- Enable RLS (already enabled, but ensure policies exist)
create policy "Allow all access for sessions"
on public.whatsapp_sessions_metadata
for all
using (true)
with check (true);
