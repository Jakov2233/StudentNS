-- StudentNS schema
-- Pokrenuti u Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ili preko supabase CLI-ja: supabase db push

-- Profili korisnika (jedan red po auth korisniku)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 30),
  bio text,
  instagram text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 300),
  constraint profiles_insta_format check (
    instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'
  )
);

-- Nadogradnja za postojece baze (create table if not exists ne menja kolone)
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists avatar_url text;

-- Mesta na mapi
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  category text not null check (category in (
    'fakulteti-obrazovanje',
    'domovi',
    'menze',
    'hrana',
    'pekare',
    'kafa-bleja',
    'pubovi',
    'mesta-za-ucenje',
    'parkovi',
    'prodavnice',
    'apoteke',
    'bankomati',
    'poste',
    'kopirnice',
    'teretane',
    'prevoz',
    'zabava',
    'korisne-lokacije'
  )),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text check (char_length(address) <= 120),
  price_level smallint check (price_level in (1, 2, 3)),
  has_wifi boolean,
  has_outlets boolean,
  noise_level text check (noise_level in ('quiet', 'moderate', 'loud')),
  crowded text check (crowded in ('low', 'medium', 'high')),
  image_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists places_category_idx on public.places (category);

-- Mesta moraju biti unutar Novog Sada i na nivou baze, ne samo u aplikaciji
alter table public.places drop constraint if exists places_ns_region;
alter table public.places add constraint places_ns_region check (
  lat between 45.19 and 45.32 and lng between 19.72 and 19.94
);

-- Nadogradnja za postojece baze: prosirena lista kategorija
alter table public.places drop constraint if exists places_category_check;
alter table public.places add constraint places_category_check check (
  category in (
    'fakulteti-obrazovanje',
    'domovi',
    'menze',
    'hrana',
    'pekare',
    'kafa-bleja',
    'pubovi',
    'mesta-za-ucenje',
    'parkovi',
    'prodavnice',
    'apoteke',
    'bankomati',
    'poste',
    'kopirnice',
    'teretane',
    'prevoz',
    'zabava',
    'korisne-lokacije'
  )
);

-- Studentski domovi u seed-u dobijaju svoju kategoriju
update public.places
set category = 'domovi'
where id::text like '10000000-%' and name like 'Studentski dom%';

-- Wi-Fi i uticnice su opcioni podatak:
-- null znaci "korisnik nije specificirao" (badge se ne prikazuje)
alter table public.places alter column has_wifi drop not null;
alter table public.places alter column has_outlets drop not null;
alter table public.places alter column has_wifi drop default;
alter table public.places alter column has_outlets drop default;

-- Seed lokacije su dodate bez tih podataka -> vrati ih na null
update public.places set has_wifi = null, has_outlets = null
where id::text like '10000000-%';

-- Pogodnosti
alter table public.places enable row level security;
alter table public.profiles enable row level security;

grant select on public.places to anon, authenticated;
grant insert on public.places to authenticated;
grant update on public.places to authenticated;
grant delete on public.places to authenticated;

grant select on public.profiles to anon, authenticated;
grant insert on public.profiles to authenticated;
grant update on public.profiles to authenticated;

-- RLS politike za mesta: javno citanje, izmene samo vlasnik
drop policy if exists "places_select" on public.places;
create policy "places_select"
  on public.places for select
  using (true);

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

-- RLS politike za profile
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automatsko kreiranje profila pri registraciji novog korisnika
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recenzije mesta: jedna recenzija po korisniku po mestu
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  coffee smallint check (coffee between 1 and 5),
  food smallint check (food between 1 and 5),
  study_friendly smallint check (study_friendly between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (place_id, author_id)
);

create index if not exists reviews_place_idx on public.reviews (place_id);
create index if not exists reviews_author_idx on public.reviews (author_id);

alter table public.reviews enable row level security;

grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
grant update on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select"
  on public.reviews for select
  using (true);

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
  with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id and not public.is_banned());

-- Faza 3: moderatori i banovi
-- Clan moderatora se postavlja rucno (postgres/owner) prvim SQL insertom,
-- a od tada moderatori mogu sami da dodaju/brisu clanove.
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

-- Storage bucket za fotografije mesta (javno citanje)
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
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

-- Storage bucket za profilne slike (javno citanje)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

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

-- Pocetna baza lokacija (seed)
-- Uklanjamo stare probne lokacije (kafici, picerija, autobuska stanica i dr.)
delete from public.places
where id in (
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012'
);

-- Domovi, fakulteti, mesta za ucenje i zeleznicka stanica Petrovaradin
insert into public.places (id, name, description, category, lat, lng, address)
values
  ('10000000-0000-0000-0000-000000000001', 'Studentski dom „Slobodan Bajić"',
   'Najveći studentski dom u Novom Sadu, na Limanu I.',
   'korisne-lokacije', 45.2451283, 19.8497323, 'Dr Sime Miloševića 10'),
  ('10000000-0000-0000-0000-000000000002', 'Studentski dom „Veljko Vlahović"',
   'Studentski dom na Limanu I, pored doma Slobodan Bajić.',
   'korisne-lokacije', 45.2455779, 19.8485050, 'Dr Sime Miloševića 8'),
  ('10000000-0000-0000-0000-000000000003', 'Studentski dom „Prof. Živojin Ćulum"',
   'Dom I kategorije na Limanu, sa čitaonicama, bibliotekom i ateljeom.',
   'korisne-lokacije', 45.2363840, 19.8408789, 'Bulevar despota Stefana 5a'),
  ('10000000-0000-0000-0000-000000000004', 'Studentski dom „Car Lazar"',
   'Dom I kategorije na Limanu, sa više čitaonica i sala za učenje.',
   'korisne-lokacije', 45.2361491, 19.8388829, 'Bulevar despota Stefana 7'),
  ('10000000-0000-0000-0000-000000000005', 'Studentski dom „Nikola Tesla"',
   'Najmlađi dom u Novom Sadu, komforne dvokrevetne sobe i čitaonice.',
   'korisne-lokacije', 45.2356936, 19.8387435, 'Bulevar despota Stefana 7a'),
  ('10000000-0000-0000-0000-000000000006', 'Studentski dom „Sajmište"',
   'Dom I kategorije blizu Sajma i centra, sa prostorijama za učenje.',
   'korisne-lokacije', 45.2567363, 19.8267847, 'Slobodana Bajića 17'),
  ('10000000-0000-0000-0000-000000000007', 'Studentski dom „23. oktobar"',
   'Studentski dom na Grbavici, u ulici Danila Kiša.',
   'korisne-lokacije', 45.2465129, 19.8368574, 'Danila Kiša 29'),
  ('10000000-0000-0000-0000-000000000008', 'Studentski dom „Feješ Klara"',
   'Dom I kategorije na Grbavici, blizu Futoškog parka.',
   'korisne-lokacije', 45.2450966, 19.8358100, 'Alekse Šantića 4'),
  ('10000000-0000-0000-0000-000000000009', 'Fakultet tehničkih nauka',
   'Najveći fakultet u Novom Sadu sa preko 20.000 studenata.',
   'fakulteti-obrazovanje', 45.2461924, 19.8513954, 'Trg Dositeja Obradovića 6'),
  ('10000000-0000-0000-0000-000000000010', 'Prirodno-matematički fakultet',
   'PMF u Novom Sadu. Prirodne nauke, matematika i informatika.',
   'fakulteti-obrazovanje', 45.2454429, 19.8529296, 'Trg Dositeja Obradovića 3'),
  ('10000000-0000-0000-0000-000000000011', 'Poljoprivredni fakultet',
   'Poljoprivredni fakultet na kampusu Univerziteta u Novom Sadu.',
   'fakulteti-obrazovanje', 45.2474278, 19.8507397, 'Trg Dositeja Obradovića 8'),
  ('10000000-0000-0000-0000-000000000012', 'Medicinski fakultet',
   'Medicinski fakultet Univerziteta u Novom Sadu.',
   'fakulteti-obrazovanje', 45.2529483, 19.8237382, 'Hajduk Veljkova 3'),
  ('10000000-0000-0000-0000-000000000013', 'Tehnološki fakultet',
   'Tehnološki fakultet Novi Sad, na početku Bulevara cara Lazara.',
   'fakulteti-obrazovanje', 45.2477463, 19.8507782, 'Bulevar cara Lazara 1'),
  ('10000000-0000-0000-0000-000000000014', 'Filozofski fakultet',
   'Filozofski fakultet - društvene i humanističke nauke.',
   'fakulteti-obrazovanje', 45.2465958, 19.8534911, 'Dr Zorana Đinđića 2'),
  ('10000000-0000-0000-0000-000000000015', 'Pravni fakultet',
   'Pravni fakultet na Trgu Dositeja Obradovića.',
   'fakulteti-obrazovanje', 45.2464098, 19.8529159, 'Trg Dositeja Obradovića 1'),
  ('10000000-0000-0000-0000-000000000016', 'Fakultet sporta i fizičkog vaspitanja',
   'Fakultet sporta i fizičkog vaspitanja na Bulevaru cara Lazara.',
   'fakulteti-obrazovanje', 45.2472222, 19.8478376, 'Bulevar cara Lazara 50'),
  ('10000000-0000-0000-0000-000000000017', 'Akademija umetnosti',
   'Akademija umetnosti u samom centru, u Đure Jakšića.',
   'fakulteti-obrazovanje', 45.2586565, 19.8437790, 'Đure Jakšića 5'),
  ('10000000-0000-0000-0000-000000000018', 'Biblioteka Matice srpske',
   'Najstarija i najbogatija srpska biblioteka, u centru grada.',
   'mesta-za-ucenje', 45.2595333, 19.8455843, 'Matice srpske 1'),
  ('10000000-0000-0000-0000-000000000019', 'Gradska biblioteka Novi Sad',
   'Čitaonica i biblioteka na Dunavskoj, u samom centru. Tiho mesto za učenje.',
   'mesta-za-ucenje', 45.2568900, 19.8484335, 'Dunavska 1'),
  ('10000000-0000-0000-0000-000000000020', 'Univerzitetska biblioteka „Svetozar Marković"',
   'Centralna biblioteka Univerziteta u Novom Sadu, otvorena za sve studente.',
   'mesta-za-ucenje', 45.2468124, 19.8501227, 'Bulevar cara Lazara 3'),
('10000000-0000-0000-0000-000000000021', 'Železnička stanica Petrovaradin',
    'Železnička stanica na petrovaradinskoj strani Dunava.',
    'prevoz', 45.2389298, 19.8857511, 'Petrovaradin')
on conflict (id) do nothing;

-- Druga serija seed-a: menze, parkovi, prodavnice, apoteke, bankomati,
-- pošte, kopirnice, teretane i stajališta.
-- Kafića/pekara/restorana je namerno malo: ideja sajta je da se takva mesta
-- otkrivaju kroz recenzije studenata, a ne da mapa bude nadopunjena kopija
-- Google Maps-a. Zato ostaje samo par legendarnih mesta.
insert into public.places (id, name, description, category, lat, lng, address, price_level, has_wifi, has_outlets, noise_level, crowded)
values
  ('20000000-0000-0000-0000-000000000001', 'Menza 1 — Studentski centar',
   'Glavna studenski centar menza u kampusu, jeftina i menijum uvek ima.',
   'menze', 45.2469000, 19.8509000, 'Bulevar cara Lazara 5', 1, true, false, 'moderate', 'medium'),
  ('20000000-0000-0000-0000-000000000002', 'Menza 2 — Sajmište',
   'Druga studenski centar menza, kod doma Sajmište.',
   'menze', 45.2557000, 19.8280000, 'Slobodana Bajića 17', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000004', 'Buregdžinica Ranković',
   'Poznata novosađanska buregdžinica u samom centru.',
   'pekare', 45.2540000, 19.8436000, 'Bulevar Mihajla Pupina 14', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000007', 'Kafić „Dnevni boravak“',
   'Poznat po mlakoj, opuštenoj atmosferi i dobroj kafi.',
   'kafa-bleja', 45.2550000, 19.8467000, 'Bulevar Mihajla Pupina 6', 2, true, false, 'moderate', 'medium'),
  ('20000000-0000-0000-0000-000000000010', 'Futoški park',
   'Veliki raskošni park sa zelenilom i klupama.',
   'parkovi', 45.2490000, 19.8240000, 'Futoški put', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000011', 'Dunavski park',
   'Centar park pored Dunava, idealan za pauzu ili čitanje.',
   'parkovi', 45.2565000, 19.8525000, 'Ulica Danila Kiša', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000012', 'Kameni park',
   'Omiljeno zelenilo u samom gradu, kod biblioteke Matice srpske.',
   'parkovi', 45.2460000, 19.8550000, 'Železnička 5', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000013', 'Sunčani kej',
   'Šetalište na Dunavu, dobro za trčanje i odmor.',
   'parkovi', 45.2590000, 19.8730000, 'Sunčani kej', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000014', 'Lidl — Bulevar cara Lazara',
   'Diskont supermarket sa jeftinim osnovnim namirnicama.',
   'prodavnice', 45.2481000, 19.8443000, 'Bulevar cara Lazara 79', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000015', 'Maxi — Futoški put',
   'Supermarket na Futoškom putu.',
   'prodavnice', 45.2533000, 19.8310000, 'Futoški put 53', 2, null, null, null, null),
  ('20000000-0000-0000-0000-000000000016', 'Knjižara „Miroslav“',
   'Knjižara u centru grada sa dobrom ponudom literature.',
   'prodavnice', 45.2550000, 19.8450000, 'Trg slobode 3', 2, null, null, null, null),
  ('20000000-0000-0000-0000-000000000017', 'Apoteka — Liman',
   'Apoteka u studentskom kvartu, pored domova.',
   'apoteke', 45.2477000, 19.8429000, 'Bulevar cara Lazara 61', 2, null, null, null, null),
  ('20000000-0000-0000-0000-000000000018', 'Apoteka — Bulevar',
   'Apoteka na početku Bulevara oslobođenja.',
   'apoteke', 45.2548000, 19.8382000, 'Bulevar oslobođenja 46', 2, null, null, null, null),
  ('20000000-0000-0000-0000-000000000019', 'Bankomat — Futoški put',
   'Bankomat u blizini parka i domova.',
   'bankomati', 45.2535000, 19.8339000, 'Futoški put 1', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000020', 'Bankomat — Trg slobode',
   'Bankomat u samom centru grada.',
   'bankomati', 45.2554000, 19.8447000, 'Trg slobode', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000021', 'Pošta 21000 Centar',
   'Glavna pošta Novog Sada.',
   'poste', 45.2546000, 19.8472000, 'Bulevar Mihajla Pupina 3', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000022', 'Pošta — Liman',
   'Pošta u studentskom kvartu.',
   'poste', 45.2470000, 19.8485000, 'Bulevar cara Lazara 18', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000023', 'Kopirnica „Krug“',
   'Kopirnica kod fakulteta, sve za štampanje i vez.',
   'kopirnice', 45.2467000, 19.8533000, 'Trg Dositeja Obradovića 1', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000024', 'Kopirnica — Centar',
   'Kopirnica u centru grada.',
   'kopirnice', 45.2550000, 19.8400000, 'Bulevar oslobođenja 38', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000025', 'Teretana Student',
   'Teretana u studentskom centru, jeftinija za studente.',
   'teretane', 45.2476000, 19.8518000, 'Bulevar cara Lazara 5', 1, null, null, null, null),
  ('20000000-0000-0000-0000-000000000026', 'Fitness centar — Liman 3',
   'Fitness centar u blizini domova na Limanu.',
   'teretane', 45.2378000, 19.8400000, 'Bulevar despota Stefana 12', 2, null, null, null, null),
  ('20000000-0000-0000-0000-000000000027', 'Stajalište „FTN“',
   'Autobusko stajalište kod Fakulteta tehničkih nauka.',
   'prevoz', 45.2466000, 19.8512000, 'Trg Dositeja Obradovića 6', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000028', 'Stajalište — Bulevar Evrope',
   'Autobusko stajalište na Bulevaru Evrope.',
   'prevoz', 45.2470000, 19.8370000, 'Bulevar Evrope', null, null, null, null, null),
  ('20000000-0000-0000-0000-000000000029', 'Turistička info tačka',
   'Info tačka za novi studente na početku Bulevara.',
   'korisne-lokacije', 45.2543000, 19.8452000, 'Bulevar Mihajla Pupina 6', null, null, null, null, null)
on conflict (id) do nothing;

-- Anti-spam: max 20 mesta po korisniku u jednom satu
create or replace function public.limit_place_inserts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt integer;
begin
  if new.created_by is null then
    return new;
  end if;
  select count(*) into cnt
  from public.places
  where created_by = new.created_by
    and created_at > now() - interval '1 hour';
  if cnt > 20 then
    raise exception 'Previse mesta u kratkom roku (max 20 na sat).';
  end if;
  return new;
end;
$$;

drop trigger if exists places_rate_limit on public.places;
create trigger places_rate_limit
  before insert on public.places
  for each row execute function public.limit_place_inserts();

-- Global chat: jedna javna soba za sve korisnike aplikacije
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_idx
  on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

grant select on public.chat_messages to anon, authenticated;
grant insert on public.chat_messages to authenticated;
grant delete on public.chat_messages to authenticated;

drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select"
  on public.chat_messages for select
  using (true);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id and not public.is_banned());

drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own"
  on public.chat_messages for delete
  using (auth.uid() = user_id and not public.is_banned());

drop policy if exists "chat_moderate_delete" on public.chat_messages;
create policy "chat_moderate_delete"
  on public.chat_messages for delete
  to authenticated
  using (public.is_moderator());

-- Anti-spam: max 30 poruka po korisniku u jednom satu
create or replace function public.limit_chat_inserts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt integer;
begin
  select count(*) into cnt
  from public.chat_messages
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';
  if cnt > 30 then
    raise exception 'Previše poruka u kratkom roku (max 30 na sat).';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_rate_limit on public.chat_messages;
create trigger chat_rate_limit
  before insert on public.chat_messages
  for each row execute function public.limit_chat_inserts();

-- Kada se poruka obrise, realtime treba da posalje i stari red,
-- da bi se poruka uklonila sa ekrana kod svih. Zato replica identity = full.
alter table public.chat_messages replica identity full;

-- Ukljuci realtime za global chat (idempotentno)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;