insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

create policy "post_photos_objects_public_read"
  on storage.objects for select
  using (bucket_id = 'post-photos');

create policy "post_photos_objects_insert_staff_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
    and (storage.foldername(name))[1] = (
      select daycare_id::text from public.users where id = auth.uid()
    )
  );

create policy "post_photos_objects_delete_staff_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );
