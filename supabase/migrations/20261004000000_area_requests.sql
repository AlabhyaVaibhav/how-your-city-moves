-- Wanted areas (#21): people suggest areas that aren't on a city's map yet and vote for them.
-- Like commutes, both tables are closed to the browser; only the functions below touch them.
-- Votes and suggestions are tied to the same hashed per-browser token as commutes, never to a person.

create table public.area_requests (
  id         bigint generated always as identity primary key,
  city       text not null,
  -- as first suggested, tidied
  name       text not null,
  -- lowercased, punctuation and spacing folded: one suggestion per place
  name_key   text not null,
  created_by text not null,
  -- set by the owner to remove a suggestion from the leaderboard
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (city, name_key)
);

create table public.area_votes (
  request_id       bigint not null references public.area_requests (id) on delete cascade,
  contributor_hash text not null,
  created_at       timestamptz not null default now(),
  primary key (request_id, contributor_hash)
);
create index area_votes_hash_idx on public.area_votes (contributor_hash, created_at);

alter table public.area_requests enable row level security;
alter table public.area_votes enable row level security;
revoke all on table public.area_requests from anon, authenticated;
revoke all on table public.area_votes from anon, authenticated;

-- one city's leaderboard: the top 20 visible suggestions, and whether this browser voted for each
create function public.area_leaderboard(p_city text, p_token uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select case when p_token is null then null else encode(extensions.digest(p_token::text, 'sha256'), 'hex') end as h),
  top as (
    select r.id, r.name, count(v.request_id)::int as votes,
           coalesce(bool_or(v.contributor_hash = (select h from me)), false) as mine, r.created_at
    from public.area_requests r
    left join public.area_votes v on v.request_id = r.id
    where r.city = p_city and not r.hidden
    group by r.id
    having count(v.request_id) > 0
    order by votes desc, r.created_at asc
    limit 20
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'votes', votes, 'mine', mine) order by votes desc, created_at asc), '[]'::jsonb)
  from top;
$$;

-- vote for a suggestion; voting twice is a no-op. Returns its vote count.
create function public.vote_area(p_token uuid, p_id bigint)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  n int;
begin
  if not exists (select 1 from public.area_requests where id = p_id and not hidden) then
    raise exception 'unknown_request' using errcode = '22023';
  end if;
  -- per-browser: 60 votes an hour
  if (select count(*) from public.area_votes where contributor_hash = h and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.area_votes (request_id, contributor_hash) values (p_id, h) on conflict do nothing;
  select count(*)::int into n from public.area_votes where request_id = p_id;
  return n;
end;
$$;

-- take a vote back. Returns the new count; a suggestion nobody votes for drops off the leaderboard.
create function public.unvote_area(p_token uuid, p_id bigint)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from public.area_votes where request_id = p_id and contributor_hash = encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  select count(*)::int into n from public.area_votes where request_id = p_id;
  return n;
end;
$$;

-- suggest an area. If it's already suggested (same name, ignoring case, spacing and punctuation), this
-- votes for that one instead. Returns { id, votes }.
create function public.suggest_area(p_token uuid, p_city text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  clean text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  k text := regexp_replace(lower(clean), '[^[:alnum:]]+', '', 'g');
  rid bigint;
begin
  if not exists (select 1 from public.areas where city = p_city) then
    raise exception 'invalid_city' using errcode = '22023';
  end if;
  -- short plain names: letters, digits, spaces and a little punctuation
  if char_length(clean) < 3 or char_length(clean) > 40 or clean !~ '^[[:alnum:] .,''&()/-]+$' or char_length(k) < 3 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  select id into rid from public.area_requests where city = p_city and name_key = k;
  if rid is null then
    -- per-browser: 5 new suggestions an hour, 30 ever
    if (select count(*) from public.area_requests where created_by = h and created_at > now() - interval '1 hour') >= 5
       or (select count(*) from public.area_requests where created_by = h) >= 30 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    insert into public.area_requests (city, name, name_key, created_by) values (p_city, clean, k, h)
    on conflict (city, name_key) do nothing
    returning id into rid;
    if rid is null then select id into rid from public.area_requests where city = p_city and name_key = k; end if;
  end if;
  return jsonb_build_object('id', rid, 'votes', public.vote_area(p_token, rid));
end;
$$;

-- "Clear my data" now also takes back this browser's votes, and drops suggestions it made that nobody
-- else has voted for.
create or replace function public.forget_my_commutes(p_token uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  h text := encode(extensions.digest(p_token::text, 'sha256'), 'hex');
  n int;
begin
  delete from public.area_votes where contributor_hash = h;
  delete from public.area_requests r where r.created_by = h and not exists (select 1 from public.area_votes v where v.request_id = r.id);
  delete from public.commutes where contributor_hash = h;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.area_leaderboard(text, uuid) from public;
revoke all on function public.vote_area(uuid, bigint) from public;
revoke all on function public.unvote_area(uuid, bigint) from public;
revoke all on function public.suggest_area(uuid, text, text) from public;
grant execute on function public.area_leaderboard(text, uuid) to anon, authenticated;
grant execute on function public.vote_area(uuid, bigint) to anon, authenticated;
grant execute on function public.unvote_area(uuid, bigint) to anon, authenticated;
grant execute on function public.suggest_area(uuid, text, text) to anon, authenticated;
