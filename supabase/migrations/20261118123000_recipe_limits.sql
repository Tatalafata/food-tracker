begin;

create table if not exists public.chefsuggest_recipe_limits (
  request_day date not null,
  bucket text not null,
  used integer not null default 0 check (used >= 0),
  last_request_at timestamptz not null,
  primary key (request_day, bucket)
);

alter table public.chefsuggest_recipe_limits enable row level security;
revoke all on public.chefsuggest_recipe_limits from public, anon, authenticated, service_role;

create or replace function public.chefsuggest_reserve_recipe_request(guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_time timestamptz;
  today date;
  guest_bucket text := 'guest:' || guest_id::text;
begin
  if guest_id is null then
    return false;
  end if;

  -- Serialize the two counters even when several Edge workers call at once.
  perform pg_catalog.pg_advisory_xact_lock(137803999, 1);
  request_time := pg_catalog.clock_timestamp();
  today := (request_time at time zone 'UTC')::date;

  if exists (
    select 1 from public.chefsuggest_recipe_limits
    where request_day = today and (
      (bucket = 'all' and used >= 20)
      or (bucket = guest_bucket and (used >= 5 or last_request_at > request_time - interval '30 seconds'))
    )
  ) then
    return false;
  end if;

  insert into public.chefsuggest_recipe_limits as quota (request_day, bucket, used, last_request_at)
  values (today, 'all', 1, request_time), (today, guest_bucket, 1, request_time)
  on conflict (request_day, bucket) do update
    set used = quota.used + 1, last_request_at = excluded.last_request_at;

  delete from public.chefsuggest_recipe_limits where request_day < today - 1;
  return true;
end;
$$;

revoke all on function public.chefsuggest_reserve_recipe_request(uuid) from public, anon, authenticated, service_role;
grant execute on function public.chefsuggest_reserve_recipe_request(uuid) to service_role;

commit;
