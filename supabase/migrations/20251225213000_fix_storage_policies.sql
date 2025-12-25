-- Allow updating media (for upsert support)
create policy "Allow update media"
on storage.objects for update
with check ( bucket_id = 'whatsapp-media' );

-- Allow deleting media (for cleanup)
create policy "Allow delete media"
on storage.objects for delete
using ( bucket_id = 'whatsapp-media' );
