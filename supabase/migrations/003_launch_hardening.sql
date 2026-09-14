-- Bluo launch hardening. Run after schema.sql and 002_security_hardening.sql.
-- 1. The browser must not be able to bypass the location RPC/rate limit.
revoke all on table public.locations from authenticated;
grant select on table public.locations to authenticated;
-- Keep SELECT denied by RLS; the RPC is the only location read path.

-- 2. PSC identity fields: graduation year is a durable year, not a current year-group number.
-- Existing 2026/27 Year 12/13 accounts are migrated to their expected leaving years.
update public.profiles
set year_group = case
  when year_group = 12 then 2028
  when year_group = 13 then 2027
  else year_group
end
where year_group in (12,13);

create or replace function public.is_psc_email(email text)
returns boolean language sql immutable as $$
  select lower(coalesce(email,'')) ~ '^[^@\s]+@students\.psc\.ac\.uk$';
$$;

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

-- 3. Launch access is stored only as a SHA-256 digest. Do not put the real code in source control.
-- After applying this migration, insert your private launch code in Supabase SQL Editor:
-- insert into public.launch_access_codes(code_hash) values (encode(public.digest(lower(trim('YOUR_PRIVATE_CODE')), 'sha256'),'hex'));
create table if not exists public.launch_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null check (code_hash ~ '^[0-9a-f]{64}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.launch_access_codes enable row level security;
revoke all on table public.launch_access_codes from anon, authenticated;

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

-- 4. Direct messages must stay inside the same community and cannot cross a block.
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages
for insert to authenticated
with check (
  sender_id=auth.uid()
  and (
    (recipient_id is not null and exists (
      select 1 from public.profiles sender
      join public.profiles recipient on recipient.id=recipient_id
      where sender.id=auth.uid()
        and sender.community=recipient.community
        and not exists (
          select 1 from public.blocks b
          where (b.blocker_id=sender.id and b.blocked_id=recipient.id)
             or (b.blocker_id=recipient.id and b.blocked_id=sender.id)
        )
    ))
    or (group_id is not null and public.is_group_member(group_id))
  )
);

-- 5. A blocked user must not be able to continue an existing DM thread.
drop policy if exists "messages members" on public.messages;
create policy "messages members" on public.messages
for select to authenticated
using (
  not exists (
    select 1 from public.blocks b
    where (b.blocker_id=auth.uid() and b.blocked_id=sender_id)
       or (b.blocker_id=sender_id and b.blocked_id=auth.uid())
       or (recipient_id is not null and b.blocker_id=auth.uid() and b.blocked_id=recipient_id)
       or (recipient_id is not null and b.blocker_id=recipient_id and b.blocked_id=auth.uid())
  )
  and (
    sender_id=auth.uid()
    or recipient_id=auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  )
);
