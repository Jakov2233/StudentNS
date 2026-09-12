-- Faza 7: DIJAGNOSTIKA — ne menja nista, samo prikazuje stanje.
-- U SQL Editor-u pokreni ceo fajl, pa mi kopiraj CELI IZLAZ (Results tab) i posalji.
-- Ovako vidim: ko ima nalog, ko nema profil red, ko je banovan, sta je u realtime-u.

select 'USERI_UKUPNO' as provera, count(*)::text as vrednost from auth.users
union all select 'PROFILI_UKUPNO', count(*)::text from public.profiles
union all select 'BANOVANI_UKUPNO', count(*)::text from public.bans
union all select 'MODERATORI_UKUPNO', count(*)::text from public.moderators
union all select 'PROFILES_U_REALTIME', case when exists (
    select 1 from pg_publication_tables p
    where p.pubname = 'supabase_realtime'
      and p.schemaname = 'public' and p.tablename = 'profiles'
  ) then 'DA' else 'NE - treba ukljuciti' end
union all select 'POLICY_AVATAR_UPLOAD', case when exists (
    select 1 from pg_policies p
    where p.schemaname = 'storage' and p.tablename = 'objects' and p.policyname = 'avatars_insert_own'
  ) then 'DA' else 'NE - fali politika' end
union all select 'POLICY_AVATAR_UPDATE', case when exists (
    select 1 from pg_policies p
    where p.schemaname = 'storage' and p.tablename = 'objects' and p.policyname = 'avatars_update_own'
  ) then 'DA' else 'NE - fali politika' end;

-- Svi korisnici i njihovi profili (email je maskiran)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)) as meta_username,
  p.id is not null as ima_profil,
  p.username as profil_username,
  p.avatar_url is not null as ima_sliku,
  b.user_id is not null as banovan,
  m.user_id is not null as moderator
from auth.users u
left join public.profiles p on p.id = u.id
left join public.bans b on b.user_id = u.id
left join public.moderators m on m.user_id = u.id
order by u.created_at;

-- Storage politike za avatars (mora ih biti najmanje insert)
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'avatar%'
order by policyname;

-- Da li su profiles i chat u realtime publikaciji
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;