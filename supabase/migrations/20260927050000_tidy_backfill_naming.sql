-- Tidy-up: consistent naming for the backfill flag, and retire the older stats functions now that the
-- site only calls city_view(). Safe on both the live database and a fresh setup.

-- 1. name the flag column is_backfill (on older databases it had another name)
do $$
declare col text; idx text;
begin
  select a.attname into col
  from pg_attribute a
  where a.attrelid = 'public.commutes'::regclass and a.atttypid = 'boolean'::regtype
    and a.attnum > 0 and not a.attisdropped and a.attname <> 'is_backfill'
  limit 1;
  if col is not null then
    execute format('alter table public.commutes rename column %I to is_backfill', col);
  end if;
  for idx in
    select indexname from pg_indexes
    where schemaname = 'public' and tablename = 'commutes' and indexname like 'commutes\_is\_%\_idx' and indexname <> 'commutes_is_backfill_idx'
  loop
    execute format('alter index public.%I rename to commutes_is_backfill_idx', idx);
  end loop;
end $$;

-- 2. retire stats functions the site no longer calls
drop function if exists public.city_rush_hours_v2();
drop function if exists public.city_rush_hours();

-- 3. recreate everything that refers to the flag
drop function if exists public._rush_hours(boolean);
create function public._rush_hours(p_include_backfill boolean)
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

create or replace function public.city_view()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with flag as (select (select count(*) from public.commutes where not is_backfill) < 200 as backfill),
  c as (
    select home_area as h, work_area as w, leave_home as l, greatest(5, commute_mins) as m,
           case when leave_work < leave_home + greatest(5, commute_mins) then leave_work + 1440 else leave_work end as w0
    from public.commutes
    where (select backfill from flag) or not is_backfill
  ),
  c2 as (select h, w, l, m, greatest(w0, l + m) as wk from c),
  st as (
    select g.s, c2.h, c2.w,
           case when x.u < c2.l + c2.m then 'o'
                when x.u < c2.wk then 'w'
                when x.u < c2.wk + c2.m then 'b'
                else 'h' end as k
    from generate_series(0, 47) as g(s)
    cross join c2
    cross join lateral (select case when g.s * 30 < c2.l then g.s * 30 + 1440 else g.s * 30 end as u) x
  ),
  agg as (select s, k, h, w, count(*)::int as n from st group by s, k, h, w),
  slots as (
    select g.s, jsonb_build_object(
      'h', coalesce((select jsonb_object_agg(h, n) from (select h, sum(n)::int as n from agg where agg.s = g.s and k = 'h' group by h) z where n >= 3), '{}'::jsonb),
      'w', coalesce((select jsonb_object_agg(w, n) from (select w, sum(n)::int as n from agg where agg.s = g.s and k = 'w' group by w) z where n >= 3), '{}'::jsonb),
      'o', coalesce((select jsonb_object_agg(h || '>' || w, n) from agg where agg.s = g.s and k = 'o' and n >= 3), '{}'::jsonb),
      'b', coalesce((select jsonb_object_agg(h || '>' || w, n) from agg where agg.s = g.s and k = 'b' and n >= 3), '{}'::jsonb)
    ) as j
    from generate_series(0, 47) as g(s)
  )
  select case when (select count(*) from c2) < 5 then null
              else jsonb_build_object(
                'total', (select count(*)::int from c2),
                'routes', coalesce((select jsonb_object_agg(h || '>' || w, n) from (select h, w, count(*)::int as n from c2 group by h, w) z where n >= 3), '{}'::jsonb),
                'hours', public._rush_hours((select backfill from flag)) -> 'hours',
                'slots', (select jsonb_agg(j order by s) from slots))
         end;
$$;

