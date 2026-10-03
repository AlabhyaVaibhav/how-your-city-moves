-- Days of the week a commute happens (#25), optional. A bitmask: Monday = 1, Tuesday = 2, Wednesday = 4,
-- Thursday = 8, Friday = 16, Saturday = 32, Sunday = 64 (Mon–Fri = 31). Null when not given.
-- Keep in step with DAYS in src/app/days.ts.

alter table public.commutes add column if not exists days smallint;
alter table public.commutes add constraint days_known check (days is null or days between 1 and 127);

-- submit_commute takes an optional p_days; calls without it still resolve here
drop function if exists public.submit_commute(uuid, text, text, int, int, int, text, text);

create or replace function public.submit_commute(
  p_token uuid, p_home text, p_work text, p_leave_home int, p_leave_work int, p_mins int, p_mode text default null,
  p_city text default 'bangalore', p_days int default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  modes constant text[] := array['walk','cycle','bike','car','public'];
begin
  if not exists (select 1 from public.areas a where a.city = p_city and a.id = p_home)
     or not exists (select 1 from public.areas a where a.city = p_city and a.id = p_work) then
    raise exception 'invalid_area' using errcode = '22023';
  end if;
  if p_mode is not null and not (p_mode = any(modes)) then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  if p_days is not null and (p_days < 1 or p_days > 127) then
    raise exception 'invalid_days' using errcode = '22023';
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

  insert into public.commutes (home_area, work_area, leave_home, leave_work, commute_mins, mode, city, days, contributor_hash)
  values (
    p_home, p_work,
    ((round(p_leave_home / 30.0) * 30)::int % 1440 + 1440) % 1440,
    ((round(p_leave_work / 30.0) * 30)::int % 1440 + 1440) % 1440,
    least(180, greatest(5, (round(p_mins / 5.0) * 5)::int)),
    p_mode,
    p_city,
    p_days::smallint,
    h
  );
end;
$$;

revoke all on function public.submit_commute(uuid, text, text, int, int, int, text, text, int) from public;
grant execute on function public.submit_commute(uuid, text, text, int, int, int, text, text, int) to anon, authenticated;
