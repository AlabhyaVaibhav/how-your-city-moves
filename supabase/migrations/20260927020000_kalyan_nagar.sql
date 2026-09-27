-- Kalyan Nagar becomes a tenth area, rows get an is_backfill flag, and the hourly counting logic
-- moves into a shared helper.

-- 1. backfill flag --------------------------------------------------------------
alter table public.commutes add column if not exists is_backfill boolean not null default false;
create index if not exists commutes_is_backfill_idx on public.commutes (is_backfill);

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
  -- whole site: a coarse brake against scripted floods
  if (select count(*) from public.commutes c where not c.is_backfill and c.created_at > now() - interval '10 minutes') >= 500 then
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
-- Hourly on-the-road counts, shared by the stats functions.
create or replace function public._rush_hours(p_include_backfill boolean)
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
    where p_include_backfill or not is_backfill
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
