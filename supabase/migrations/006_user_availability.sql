-- Calculate each user's availability from their own timetable.
-- Run after 005_production_policy_hardening.sql.

create or replace function public.get_visible_availability()
returns table(user_id uuid, free boolean)
language sql
security definer
stable
set search_path=public
as $$
  select
    p.id as user_id,
    not exists (
      select 1
      from public.timetables t
      where t.user_id = p.id
        and t.day = extract(isodow from now() at time zone 'Europe/London')::integer
        and (now() at time zone 'Europe/London')::time >= t.start_time
        and (now() at time zone 'Europe/London')::time < t.end_time
    ) as free
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.community = (select community from public.profiles where id = auth.uid())
    and not p.dnd
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    );
$$;

revoke all on function public.get_visible_availability() from public, anon;
grant execute on function public.get_visible_availability() to authenticated;

create index if not exists timetables_user_day_time_idx
  on public.timetables (user_id, day, start_time, end_time);
