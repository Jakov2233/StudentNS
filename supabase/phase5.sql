-- Faza 5: storage bucketi i politike za slike (place-photos + avatars)
-- Samo pokreni ceo ovaj fajl u SQL Editor-u: Ctrl+A, Ctrl+C, Ctrl+V, Run.
-- Sigurno je pokrenuti vise puta (idempotentno).

insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "place_photos_insert_own" on storage.objects;
create policy "place_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce(metadata->>'mimeType', metadata->>'contentType') like 'image/%'
    and not public.is_banned()
  );

drop policy if exists "place_photos_delete_own" on storage.objects;
create policy "place_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_banned()
  );

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce(metadata->>'mimeType', metadata->>'contentType') like 'image/%'
    and not public.is_banned()
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_banned()
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_banned()
  );