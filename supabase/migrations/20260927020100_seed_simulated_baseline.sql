-- Simulated baseline: ~4,000 generated commutes (is_seed = true) so the "Everyone" rush-hours view has a
-- realistic shape before real visitors have shared enough. city_rush_hours_v2() stops using them once
-- 200 real commutes exist, and the site labels them as simulated.
--
-- Pattern (per the site owner): most people live in HSR Layout, Koramangala, JP Nagar and Kalyan Nagar and
-- work in Electronic City, Whitefield, Marathahalli and Manyata Tech Park; Kalyan Nagar mostly goes to
-- Manyata. Offices start between 08:00 and 11:30; people leave work between 16:30 and 19:00.
--
-- Remove them any time with:  delete from public.commutes where is_seed;

do $$
declare
  h record; w record; i int;
  u float8; acc float8;
  v_work text; v_base int; v_mins int; v_arrive int;
begin
  if exists (select 1 from public.commutes where is_seed) then return; end if;  -- run once
  perform setseed(0.4242);                                                     -- same data every time

  for h in select * from (values ('hsr', 1012), ('koramangala', 987), ('jpnagar', 1034), ('kalyannagar', 968)) v(home, n) loop
    for i in 1..h.n loop
      -- pick a workplace by share; base = typical one-way minutes for that pair
      u := random(); acc := 0;
      for w in
        select * from (values
          ('hsr', 1, 'electronic', .35, 40), ('hsr', 2, 'marathahalli', .25, 35), ('hsr', 3, 'whitefield', .20, 60), ('hsr', 4, 'manyata', .20, 75),
          ('koramangala', 1, 'whitefield', .30, 60), ('koramangala', 2, 'marathahalli', .25, 40), ('koramangala', 3, 'manyata', .25, 65), ('koramangala', 4, 'electronic', .20, 50),
          ('jpnagar', 1, 'electronic', .45, 45), ('jpnagar', 2, 'whitefield', .20, 85), ('jpnagar', 3, 'marathahalli', .20, 60), ('jpnagar', 4, 'manyata', .15, 80),
          ('kalyannagar', 1, 'manyata', .70, 20), ('kalyannagar', 2, 'whitefield', .15, 55), ('kalyannagar', 3, 'marathahalli', .10, 45), ('kalyannagar', 4, 'electronic', .05, 90)
        ) t(home, ord, work, share, base)
        where t.home = h.home order by t.ord
      loop
        acc := acc + w.share; v_work := w.work; v_base := w.base;
        exit when u <= acc;
      end loop;

      -- commute: typical time, 10 min faster to 20 min slower
      v_mins := least(180, greatest(5, (round((v_base + random() * 30 - 10) / 5.0) * 5)::int));
      -- arrival 08:00–11:30, bunched towards the middle (average of two uniforms)
      v_arrive := 480 + round(210 * (random() + random()) / 2)::int;

      insert into public.commutes (home_area, work_area, leave_home, leave_work, commute_mins, contributor_hash, is_seed)
      values (
        h.home, v_work,
        ((round((v_arrive - v_mins) / 30.0) * 30)::int % 1440 + 1440) % 1440,
        990 + (round(150 * (random() + random()) / 2 / 30.0) * 30)::int,   -- 16:30–19:00
        v_mins,
        'seed', true
      );
    end loop;
  end loop;
end $$;
