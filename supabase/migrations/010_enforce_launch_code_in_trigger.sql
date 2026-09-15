-- Enforce the launch code inside the same transaction that creates auth.users/profiles,
-- so no account can ever be persisted without a valid code — even if the API layer is bypassed.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  base_username text;
  candidate text;
  suffix integer := 0;
  display text;
  requested_year text;
  safe_year smallint;
begin
  if not public.is_psc_email(new.email) then
    raise exception 'Bluo currently requires a @students.psc.ac.uk email';
  end if;

  if not public.validate_launch_code(new.raw_user_meta_data->>'access_code') then
    raise exception 'invalid_launch_code';
  end if;

  display := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''), split_part(new.email,'@',1)),60);
  base_username := lower(regexp_replace(split_part(new.email,'@',1),'[^a-zA-Z0-9_]','','g'));
  base_username := left(case when char_length(base_username) < 3 then base_username || 'bluo' else base_username end, 20);
  candidate := base_username;

  while exists(select 1 from public.profiles where username=candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 20-char_length(suffix::text)-1) || '_' || suffix::text;
  end loop;

  requested_year := trim(coalesce(new.raw_user_meta_data->>'year_group',''));
  safe_year := case when requested_year ~ '^(2027|2028|2029|2030|2031|2032|2033|2034|2035|2036|2037|2038|2039|2040)$' then requested_year::smallint else null end;

  insert into public.profiles(id,display_name,username,year_group,community)
  values(new.id,display,candidate,safe_year,'psc')
  on conflict(id) do update set
    display_name=excluded.display_name,
    year_group=coalesce(excluded.year_group,public.profiles.year_group),
    updated_at=now();

  -- The launch code is a private secret; never let it linger in a user's own metadata.
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'access_code' where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
