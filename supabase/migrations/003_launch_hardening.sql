-- Bluo launch hardening. Run after schema.sql and 002_security_hardening.sql.
-- 1. The browser must not be able to bypass the location RPC/rate limit.
revoke all on table public.locations from authenticated;
grant insert, update on table public.locations to authenticated;
-- The RPC is the only location read path; raw coordinates must never be selectable.

-- 2. Fix the PSC email regex and make malformed year-group metadata harmless.
create or replace function public.is_psc_email(email text)
returns boolean language sql immutable as $$
  select lower(coalesce(email,'')) ~ '^[^@\s]+@students\.psc\.ac\.uk$';
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public,auth as $$
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
  safe_year := case when requested_year ~ '^(12|13)$' then requested_year::smallint else null end;

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

-- 3. Direct messages must stay inside the same community and cannot cross a block.
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

-- 4. A blocked user must not be able to continue an existing DM thread.
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
