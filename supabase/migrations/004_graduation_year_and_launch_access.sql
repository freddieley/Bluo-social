-- Bluo auth update: durable graduation years + private PSC launch access.
-- Run this migration once after 003_launch_hardening.sql.

-- Existing 2026/27 accounts used current year-group numbers. Convert them once.
update public.profiles
set year_group = case
  when year_group = 12 then 2028
  when year_group = 13 then 2027
  else year_group
end
where year_group in (12, 13);

-- New accounts store the year they are expected to leave/graduate.
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

  display := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''), split_part(new.email,'@',1)),60);
  base_username := lower(regexp_replace(split_part(new.email,'@',1),'[^a-zA-Z0-9_]','','g'));
  base_username := left(case when char_length(base_username) < 3 then base_username || 'bluo' else base_username end, 22);
  candidate := base_username;

  while exists(select 1 from public.profiles where username=candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 30-char_length(suffix::text)-1) || '_' || suffix::text;
  end loop;

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

-- Store only a SHA-256 digest. Never commit the real launch code to the repo.
create table if not exists public.launch_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null check (code_hash ~ '^[0-9a-f]{64}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.launch_access_codes enable row level security;
revoke all on table public.launch_access_codes from anon, authenticated;

-- After applying this migration, create the private code in Supabase SQL Editor with:
-- insert into public.launch_access_codes(code_hash)
-- values (encode(public.digest(lower(trim('YOUR_PRIVATE_CODE')), 'sha256'),'hex'));

drop function if exists public.validate_launch_code(text);
create function public.validate_launch_code(p_code text)
returns boolean
language sql
security definer
stable
set search_path=''
as $$
  select exists (
    select 1
    from public.launch_access_codes
    where active
      and code_hash = encode(public.digest(lower(trim(coalesce(p_code,''))), 'sha256'),'hex')
  );
$$;
revoke all on function public.validate_launch_code(text) from public;
grant execute on function public.validate_launch_code(text) to anon, authenticated;
