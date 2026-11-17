begin;

create table if not exists public.chefsuggest_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  backup jsonb not null check (
    jsonb_typeof(backup) = 'object'
    and backup @> '{"version":1}'::jsonb
    and octet_length(backup::text) <= 1500000
  ),
  updated_at timestamptz not null default clock_timestamp()
);

create or replace function public.chefsuggest_backup_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;

drop trigger if exists chefsuggest_backup_timestamp on public.chefsuggest_backups;
create trigger chefsuggest_backup_timestamp
before insert or update on public.chefsuggest_backups
for each row execute function public.chefsuggest_backup_timestamp();

alter table public.chefsuggest_backups enable row level security;
revoke all on public.chefsuggest_backups from public, anon, authenticated;
grant select on public.chefsuggest_backups to authenticated;
grant insert (user_id, backup), update (backup) on public.chefsuggest_backups to authenticated;

drop policy if exists backup_read on public.chefsuggest_backups;
create policy backup_read on public.chefsuggest_backups for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists backup_insert on public.chefsuggest_backups;
create policy backup_insert on public.chefsuggest_backups for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists backup_update on public.chefsuggest_backups;
create policy backup_update on public.chefsuggest_backups for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;
