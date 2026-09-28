-- Ten more areas (#2): Peenya, Yeswanthpur, Dobaspet, Jayanagar, Bommasandra, Chandapura, Attibele,
-- Sarjapur Road, Varthur and KR Puram / Tin Factory. Keep this list in step with NODES in src/app/data.ts.

alter table public.commutes drop constraint areas_known;
alter table public.commutes add constraint areas_known check (
  home_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar',
    'peenya','yeswanthpur','dobaspet','jayanagar','bommasandra','chandapura','attibele','sarjapur','varthur','krpuram')
  and work_area in ('manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar',
    'peenya','yeswanthpur','dobaspet','jayanagar','bommasandra','chandapura','attibele','sarjapur','varthur','krpuram'));

create or replace function public.submit_commute(
  p_token uuid, p_home text, p_work text, p_leave_home int, p_leave_work int, p_mins int
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  areas constant text[] := array['manyata','mgroad','indiranagar','jpnagar','koramangala','marathahalli','whitefield','hsr','electronic','kalyannagar',
    'peenya','yeswanthpur','dobaspet','jayanagar','bommasandra','chandapura','attibele','sarjapur','varthur','krpuram'];
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
