-- city_view(): everything the "Everyone" mode needs in one call.
--   { hours: int[24],                       people on the road in each hour (rush-hours chart)
--     slots: [48 × { h, w, o, b }] }        every half hour from 00:00:
--        h: { area: n }  at home        w: { area: n }  at work
--        o: { "home>work": n } heading to work     b: { "home>work": n } heading home
-- Uses the same status rules as the app's statusAt(). Counts under 3 are left out so no single
-- commute can be picked out.
-- Returns null if fewer than 5 rows are in play.

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
                'hours', public._rush_hours((select backfill from flag)) -> 'hours',
                'slots', (select jsonb_agg(j order by s) from slots))
         end;
$$;

revoke all on function public.city_view() from public;
grant execute on function public.city_view() to anon, authenticated;
