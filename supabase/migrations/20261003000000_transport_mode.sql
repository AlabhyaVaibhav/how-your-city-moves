-- How people get to work (#10). Optional: older clients and earlier rows have no mode.
-- Keep the mode list in step with MODES in src/app/data.ts.

alter table public.commutes add column if not exists mode text;
alter table public.commutes add constraint modes_known check (mode is null or mode in ('walk','cycle','bike','car','public'));

-- submit_commute takes an optional p_mode. Drop the six-argument version so calls without a mode
-- resolve to this one instead of being ambiguous.
drop function if exists public.submit_commute(uuid, text, text, int, int, int);

create or replace function public.submit_commute(
  p_token uuid, p_home text, p_work text, p_leave_home int, p_leave_work int, p_mins int, p_mode text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  areas constant text[] := array['manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar',
    'peenya','yeswanthpur','dobaspet','jayanagar','bommasandra','chandapura','attibele','sarjapur','varthur','krpuram'];
  modes constant text[] := array['walk','cycle','bike','car','public'];
begin
  if not (p_home = any(areas)) or not (p_work = any(areas)) then
    raise exception 'invalid_area' using errcode = '22023';
  end if;
  if p_mode is not null and not (p_mode = any(modes)) then
    raise exception 'invalid_mode' using errcode = '22023';
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

  insert into public.commutes (home_area, work_area, leave_home, leave_work, commute_mins, mode, contributor_hash)
  values (
    p_home, p_work,
    ((round(p_leave_home / 30.0) * 30)::int % 1440 + 1440) % 1440,
    ((round(p_leave_work / 30.0) * 30)::int % 1440 + 1440) % 1440,
    least(180, greatest(5, (round(p_mins / 5.0) * 5)::int)),
    p_mode,
    h
  );
end;
$$;

revoke all on function public.submit_commute(uuid, text, text, int, int, int, text) from public;
grant execute on function public.submit_commute(uuid, text, text, int, int, int, text) to anon, authenticated;

-- city_view() gains modes: { "car": n } commuters per mode (modes with fewer than 3 are left out).
create or replace function public.city_view()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with flag as (select (select count(*) from public.commutes where not is_backfill) < 200 as backfill),
  c as (
    select home_area as h, work_area as w, mode as md, leave_home as l, greatest(5, commute_mins) as m,
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
                'modes', coalesce((select jsonb_object_agg(md, n) from (select md, count(*)::int as n from c where md is not null group by md) z where n >= 3), '{}'::jsonb),
                'hours', public._rush_hours((select backfill from flag)) -> 'hours',
                'slots', (select jsonb_agg(j order by s) from slots))
         end;
$$;
