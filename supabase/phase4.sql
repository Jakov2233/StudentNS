-- Faza 4: Global chat (jedna javna soba)
-- Pokrenuti ceo blok u Supabase SQL Editoru. Idempotentan je:
-- bezbedno ga je pokrenuti vise puta. Redosled nije vazan,
-- ali najjednostavnije je posle phase1/2/3.

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