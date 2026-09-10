-- Faza 3: moderatori i banovi
-- Pokrenuti ceo blok jednom u Supabase SQL Editoru (posle phase1.sql i phase2.sql).
-- Od tada moderatori sami mogu da dodaju/brisu clanove iz aplikacije.
-- Prvog moderatora upisujes tek na kraju fajla (vidi "KORAK 2" pri dnu).

-- Tabele

create table if not exists public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.bans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  banned_by uuid references auth.users (id),
  reason text not null default 'Trolovanje'
    check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now()
);

-- Pomocne funkcije

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.moderators where user_id = auth.uid());
$$;

create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.bans where user_id = auth.uid());
$$;

-- RLS za moderatore

alter table public.moderators enable row level security;
grant select, insert, delete on public.moderators to authenticated;

drop policy if exists "moderators_select_own" on public.moderators;
drop policy if exists "moderators_select" on public.moderators;
create policy "moderators_select"
  on public.moderators for select
  using (true);

drop policy if exists "moderators_manage" on public.moderators;
create policy "moderators_manage"
  on public.moderators for all
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- RLS za banove

alter table public.bans enable row level security;
grant select, insert, delete on public.bans to authenticated;

drop policy if exists "bans_select" on public.bans;
create policy "bans_select"
  on public.bans for select
  using (auth.uid() = user_id or public.is_moderator());

drop policy if exists "bans_insert" on public.bans;
create policy "bans_insert"
  on public.bans for insert
  to authenticated
  with check (public.is_moderator() and auth.uid() <> user_id);

drop policy if exists "bans_delete" on public.bans;
create policy "bans_delete"
  on public.bans for delete
  to authenticated
  using (public.is_moderator());

-- Zabrana pisanja banovanim korisnicima

drop policy if exists "places_insert_own" on public.places;
create policy "places_insert_own"
  on public.places for insert
  with check (auth.uid() = created_by and not public.is_banned());

drop policy if exists "places_update_own" on public.places;
create policy "places_update_own"
  on public.places for update
  using (auth.uid() = created_by and not public.is_banned())
  with check (auth.uid() = created_by and not public.is_banned());

drop policy if exists "places_delete_own" on public.places;
create policy "places_delete_own"
  on public.places for delete
  using (auth.uid() = created_by and not public.is_banned());

drop policy if exists "places_moderate_delete" on public.places;
create policy "places_moderate_delete"
  on public.places for delete
  to authenticated
  using (public.is_moderator());

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = author_id and not public.is_banned());

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = author_id and not public.is_banned())
  with check (auth.uid() = author_id and not public.is_banned());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = author_id and not public.is_banned());

drop policy if exists "reviews_moderate_delete" on public.reviews;
create policy "reviews_moderate_delete"
  on public.reviews for delete
  to authenticated
  using (public.is_moderator());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id and not public.is_banned());

-- Zabrana slanja fotografija banovanim korisnicima

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
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and not public.is_banned());

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_banned()
  );

-- ---------------------------------------------------------------
-- KORAK 2: NAKON sto gornji blok prodje bez greske, pokreni ovo:
-- zameni __TvojUserID__ svojim ID-em iz Authentication -> Users.
-- ---------------------------------------------------------------
-- insert into public.moderators (user_id)
-- values ('__TvojUserID__')
-- on conflict (user_id) do nothing;
-- ---------------------------------------------------------------