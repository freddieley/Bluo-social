-- Username-first sign-in for Bluo.
-- Initial eligibility/authentication remains institution-backed; usernames are the
-- durable login handle after an account has been created.

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce(current_setting('bluo.username_claim', true), '') <> 'on' then
    new.username := old.username;
  end if;
  new.community := old.community;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

revoke all on function public.protect_profile_identity() from public, anon, authenticated;

drop function if exists public.claim_username(text);
create function public.claim_username(p_username text)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  clean text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  clean := lower(trim(coalesce(p_username, '')));
  if clean !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'Username must be 3-20 characters using letters, numbers, or underscores';
  end if;

  if clean in ('admin','administrator','support','bluo','official','moderator','mod','help','security','system','root') then
    raise exception 'That username is reserved';
  end if;

  if exists (select 1 from public.profiles where username = clean and id <> auth.uid()) then
    raise exception 'Username is already taken';
  end if;

  perform set_config('bluo.username_claim', 'on', true);
  update public.profiles
    set username = clean, updated_at = now()
    where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  return clean;
end;
$$;

revoke all on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated;
