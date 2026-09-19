-- Mutuals can always see each other's shared location.
-- This bypasses the school-hours schedule for mutuals while preserving
-- explicit hiding, blocks, and the "nobody" visibility setting.
-- Non-mutual visibility continues to respect the location schedule.

create or replace function public.get_visible_locations()
returns table(user_id uuid, lat double precision, lng double precision, accuracy_m real, updated_at timestamptz, exact boolean)
language sql security definer stable set search_path=public as $$
select
  l.user_id,
  case when f1.follower_id is not null and f2.follower_id is not null
    then l.lat else round(l.lat::numeric, 3)::double precision end,
  case when f1.follower_id is not null and f2.follower_id is not null
    then l.lng else round(l.lng::numeric, 3)::double precision end,
  l.accuracy_m,
  l.updated_at,
  (f1.follower_id is not null and f2.follower_id is not null)
from public.locations l
join public.profiles p on p.id = l.user_id
left join public.follows f1
  on f1.follower_id = auth.uid() and f1.following_id = l.user_id
left join public.follows f2
  on f2.follower_id = l.user_id and f2.following_id = auth.uid()
where auth.uid() is not null
  and l.user_id <> auth.uid()
  and not l.is_hidden
  and not p.dnd
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = l.user_id)
       or (b.blocker_id = l.user_id and b.blocked_id = auth.uid())
  )
  and p.visible_to <> 'nobody'
  and (
    -- Mutuals can see each other whenever location sharing is active.
    (f1.follower_id is not null and f2.follower_id is not null)
    or (
      p.location_mode = 'always'
      or (
        p.location_mode = 'school_hours'
        and extract(isodow from now() at time zone 'Europe/London') between 1 and 5
        and (now() at time zone 'Europe/London')::time between time '09:00' and time '16:40'
      )
    )
  )
  and (
    p.visible_to = 'friends_exact_others_approx'
    or (f1.follower_id is not null and f2.follower_id is not null)
  );
$$;

grant execute on function public.get_visible_locations() to authenticated;
