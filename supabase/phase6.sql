-- Faza 6: dijagnostika gresaka sa korisnickih uredjaja + realtime za profile
-- Pokreni ceo fajl u SQL Editor-u (Ctrl+A, Ctrl+C, Ctrl+V, Run). Idempotentno.

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  url text not null default '',
  message text not null default '',
  stack text not null default '',
  component text not null default '',
  user_agent text not null default '',
  check (char_length(message) <= 2000),
  check (char_length(stack) <= 2000),
  check (char_length(component) <= 2000)
);

alter table public.client_errors enable row level security;

grant insert on public.client_errors to anon, authenticated;
grant select on public.client_errors to authenticated;

drop policy if exists "client_errors_insert" on public.client_errors;
create policy "client_errors_insert"
  on public.client_errors for insert
  with check (true);

drop policy if exists "client_errors_select_mod" on public.client_errors;
create policy "client_errors_select_mod"
  on public.client_errors for select
  to authenticated
  using (public.is_moderator());

-- Realtime za profiles: kad neko promeni profilnu sliku ili ime,
-- svi otvoreni klijenti vide promenu odmah
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end;
$$;