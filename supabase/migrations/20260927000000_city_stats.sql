-- City-wide stats for How Bangalore moves.
-- Opt-in, anonymous, aggregate-only. The browser never reads or writes the table directly:
-- it can only call the three functions below with the public (anon/publishable) key.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.commutes (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  home_area        text not null,
  work_area        text not null,
  leave_home       smallint not null,  -- minute of day, multiple of 30
  leave_work       smallint not null,  -- minute of day, multiple of 30
  commute_mins     smallint not null,  -- 5..180, multiple of 5
  contributor_hash text not null,      -- sha256 of a random per-browser token; lets that browser delete its rows
  constraint areas_known check (
    home_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic')
    and work_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic')),
  constraint leave_home_ok  check (leave_home between 0 and 1410 and leave_home % 30 = 0),
  constraint leave_work_ok  check (leave_work between 0 and 1410 and leave_work % 30 = 0),
  constraint commute_ok     check (commute_mins between 5 and 180 and commute_mins % 5 = 0)
);

create index if not exists commutes_contributor_idx on public.commutes (contributor_hash);
create index if not exists commutes_created_idx on public.commutes (created_at);

-- Closed to the browser: RLS on with no policies, and no table grants.
alter table public.commutes enable row level security;
revoke all on table public.commutes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_commute: validate, round, rate-limit, insert.
create or replace function public.submit_commute(
  p_token uuid, p_home text, p_work text, p_leave_home int, p_leave_work int, p_mins int
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
begin
  -- per-browser: 10 an hour, 50 ever
  if (select count(*) from public.commutes c where c.contributor_hash = h and c.created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.commutes c where c.contributor_hash = h) >= 50 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  -- whole site: a coarse brake against scripted floods
  if (select count(*) from public.commutes c where c.created_at > now() - interval '10 minutes') >= 500 then
    raise exception 'busy' using errcode = 'P0001';
  end if;

  insert into public.commutes (home_area, work_area, leave_home, leave_work, commute_mins, contributor_hash)
  values (
    p_home, p_work,
    ((round(p_leave_home / 30.0) * 30)::int % 1440 + 1440) % 1440,
    ((round(p_leave_work / 30.0) * 30)::int % 1440 + 1440) % 1440,
    least(180, greatest(5, (round(p_mins / 5.0) * 5)::int)),
    h
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- city_rush_hours: people on the road in each hour, same overlap rule as the app.
-- Returns null until at least 5 commutes exist, so single entries can't be picked out.
create or replace function public.city_rush_hours()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with c as (
    select leave_home as l, commute_mins as m,
           case when leave_work < leave_home + commute_mins then leave_work + 1440 else leave_work end as w
    from public.commutes
  ),
  total as (select count(*)::int as n from c),
  hrs as (
    select h.h, count(c.l) filter (where exists (
             select 1 from (values (-1440), (0), (1440)) o(o)
             where (c.l + o.o < (h.h + 1) * 60 and c.l + c.m + o.o > h.h * 60)
                or (c.w + o.o < (h.h + 1) * 60 and c.w + c.m + o.o > h.h * 60)))::int as n
    from generate_series(0, 23) as h(h)
    left join c on true
    group by h.h
  )
  select case when (select n from total) < 5 then null
              else jsonb_build_object('total', (select n from total), 'hours', (select jsonb_agg(n order by h) from hrs))
         end;
$$;

-- ---------------------------------------------------------------------------
-- forget_my_commutes: delete everything this browser shared. Returns rows removed.
create or replace function public.forget_my_commutes(p_token uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from public.commutes where contributor_hash = encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.submit_commute(uuid, text, text, int, int, int) from public;
revoke all on function public.city_rush_hours() from public;
revoke all on function public.forget_my_commutes(uuid) from public;
grant execute on function public.submit_commute(uuid, text, text, int, int, int) to anon, authenticated;
grant execute on function public.city_rush_hours() to anon, authenticated;
grant execute on function public.forget_my_commutes(uuid) to anon, authenticated;
