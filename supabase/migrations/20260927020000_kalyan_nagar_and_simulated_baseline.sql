-- Kalyan Nagar becomes a tenth area, and generated "simulated baseline" rows can live alongside real
-- shared commutes. Generated rows are flagged with is_seed and are only shown until enough real
-- commutes exist; the site labels them as simulated.

-- 1. seed flag ------------------------------------------------------------------
alter table public.commutes add column if not exists is_seed boolean not null default false;
create index if not exists commutes_is_seed_idx on public.commutes (is_seed);

-- 2. new area -----------------------------------------------------------------
alter table public.commutes drop constraint areas_known;
alter table public.commutes add constraint areas_known check (
  home_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar')
  and work_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar'));

create or replace function public.submit_commute(
  p_token uuid, p_home text, p_work text, p_leave_home int, p_leave_work int, p_mins int
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  areas constant text[] := array['manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar'];
begin
  if not (p_home = any(areas)) or not (p_work = any(areas)) then
    raise exception 'invalid_area' using errcode = '22023';
  end if;
  if p_leave_home is null or p_leave_work is null or p_mins is null then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  -- per-browser: 10 an hour, 50 ever
  if (select count(*) from public.commutes c where c.contributor_hash = h and c.created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.commutes c where c.contributor_hash = h) >= 50 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  -- whole site: a coarse brake against scripted floods (real submissions only)
  if (select count(*) from public.commutes c where not c.is_seed and c.created_at > now() - interval '10 minutes') >= 500 then
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

-- 3. stats ----------------------------------------------------------------------
-- Shared by both stats functions: hourly on-the-road counts for a set of rows.
create or replace function public._rush_hours(p_include_seed boolean)
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
    where p_include_seed or not is_seed
  ),
  hrs as (
    select h.h, count(c.l) filter (where exists (
             select 1 from (values (-1440), (0), (1440)) o(o)
             where (c.l + o.o < (h.h + 1) * 60 and c.l + c.m + o.o > h.h * 60)
                or (c.w + o.o < (h.h + 1) * 60 and c.w + c.m + o.o > h.h * 60)))::int as n
    from generate_series(0, 23) as h(h)
    left join c on true
    group by h.h
  )
  select jsonb_build_object('total', (select count(*)::int from c), 'hours', (select jsonb_agg(n order by h) from hrs));
$$;
revoke all on function public._rush_hours(boolean) from public, anon, authenticated;

-- v1, still called by the currently deployed site: real shared commutes only, never generated ones.
create or replace function public.city_rush_hours()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when (r->>'total')::int < 5 then null else r end
  from (select public._rush_hours(false) as r) x;
$$;

-- v2: simulated baseline + real shares until 200 real commutes exist, then real only.
--   { total, shared, simulated: bool, hours: int[24] }  or null if fewer than 5 rows in play.
create or replace function public.city_rush_hours_v2()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with shared_rows as (select count(*)::int as n from public.commutes where not is_seed),
       pick as (select (select n from shared_rows) < 200 as sim),
       r as (select public._rush_hours((select sim from pick)) as j)
  select case when ((select j from r)->>'total')::int < 5 then null
              else (select j from r) || jsonb_build_object('shared', (select n from shared_rows), 'simulated', (select sim from pick))
         end;
$$;

revoke all on function public.city_rush_hours_v2() from public;
grant execute on function public.city_rush_hours_v2() to anon, authenticated;
