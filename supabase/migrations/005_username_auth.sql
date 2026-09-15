-- Bluo auth update: usernames replace real email addresses as the sign-in identifier.
-- Supabase Auth still uses its email/password API internally, but the address is a
-- private synthetic identifier and is never shown to or collected from users.
-- Apply this migration after 004_graduation_year_and_launch_access.sql.

-- Move existing auth identities to a private, non-deliverable auth identifier.
-- The application never displays this value and no email is sent to it.
update auth.users u
set email = lower(p.username) || '@auth.bluo.app',
    email_confirmed_at = coalesce(u.email_confirmed_at, now()),
    confirmation_sent_at = null,
    confirmation_token = ''
from public.profiles p
where p.id = u.id
  and p.username is not null
  and u.email <> lower(p.username) || '@auth.bluo.app';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  requested_username text;
  candidate text;
  suffix integer := 0;
  display text;
  requested_year text;
  safe_year smallint;
begin
  requested_username := lower(trim(coalesce(new.raw_user_meta_data->>'username','')));
  if requested_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'Choose a username using 3-30 lowercase letters, numbers or underscores';
  end if;

  candidate := requested_username;
  while exists(select 1 from public.profiles where username=candidate) loop
    suffix := suffix + 1;
    if suffix > 9999 then raise exception 'That username is already taken'; end if;
    candidate := left(requested_username, 30-char_length(suffix::text)-1) || '_' || suffix::text;
  end loop;

  display := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''), candidate),60);
  requested_year := trim(coalesce(new.raw_user_meta_data->>'year_group',''));
  safe_year := case when requested_year ~ '^(2027|2028|2029|2030|2031|2032|2033|2034|2035|2036|2037|2038|2039|2040)$' then requested_year::smallint else null end;

  insert into public.profiles(id,display_name,username,year_group,community)
  values(new.id,display,candidate,safe_year,'psc')
  on conflict(id) do update set
    display_name=excluded.display_name,
    year_group=coalesce(excluded.year_group,public.profiles.year_group),
    updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
