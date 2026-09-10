-- StudentNS — Faza 2: Favoriti (dodavanje postojecem sistemu)
-- Bezbedno je pokrenuti vise puta (sve je idempotentno).
-- Pokreni posle phase1.sql u Supabase > SQL Editor i javi rezultat.

-- Favoriti: svaki korisnik svoju listu mesta
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id);

alter table public.favorites enable row level security;

grant select, insert, delete on public.favorites to authenticated;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);