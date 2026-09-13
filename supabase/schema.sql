create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  year_group smallint,
  community text not null default 'psc',
  avatar jsonb not null default '{"skin":"#F0B98A","hair":"#2A1C17","shirt":"#1B78FF","bg":"#E8F4FF","eyes":"#26344A","mouth":"#A95B55"}',
  status text not null default '',
  location_mode text not null default 'school_hours' check (location_mode in ('school_hours','always','manual')),
  visible_to text not null default 'friends_exact_others_approx' check (visible_to in ('friends_exact_others_approx','friends_only','nobody')),
  dnd boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.follows (follower_id uuid not null references public.profiles(id) on delete cascade, following_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key (follower_id,following_id), check (follower_id<>following_id));
create table if not exists public.blocks (blocker_id uuid not null references public.profiles(id) on delete cascade, blocked_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key (blocker_id,blocked_id), check (blocker_id<>blocked_id));
create table if not exists public.locations (user_id uuid primary key references public.profiles(id) on delete cascade, lat double precision not null check(lat between -90 and 90), lng double precision not null check(lng between -180 and 180), accuracy_m real, is_hidden boolean not null default false, updated_at timestamptz not null default now());
create table if not exists public.timetables (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, day smallint not null check(day between 1 and 7), start_time time not null, end_time time not null, subject text not null, room text, created_at timestamptz not null default now());
create table if not exists public.groups (id uuid primary key default gen_random_uuid(), community text not null default 'psc', name text not null check(char_length(name) between 1 and 80), owner_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.group_members (group_id uuid not null references public.groups(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key(group_id,user_id));
create table if not exists public.messages (id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade, group_id uuid references public.groups(id) on delete cascade, recipient_id uuid references public.profiles(id) on delete cascade, body text not null check(char_length(body) between 1 and 4000), created_at timestamptz not null default now(), check((group_id is null)<>(recipient_id is null)));
create table if not exists public.push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, endpoint text unique not null, subscription jsonb not null, created_at timestamptz not null default now());

create or replace function public.is_psc_email(email text) returns boolean language sql immutable as $$ select lower(email) like '%@students.psc.ac.uk'; $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin if not public.is_psc_email(new.email) then raise exception 'Bluo currently requires a @students.psc.ac.uk email'; end if; insert into public.profiles(id,display_name,username) values(new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),lower(regexp_replace(split_part(new.email,'@',1),'[^a-zA-Z0-9_]','','g'))) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.locations enable row level security;
alter table public.timetables enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using(true);
create policy "users update own profile" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy "follow visible to participants" on public.follows for select to authenticated using(auth.uid()=follower_id or auth.uid()=following_id);
create policy "follow own" on public.follows for insert to authenticated with check(auth.uid()=follower_id);
create policy "unfollow own" on public.follows for delete to authenticated using(auth.uid()=follower_id);
create policy "blocks private" on public.blocks for select to authenticated using(auth.uid()=blocker_id or auth.uid()=blocked_id);
create policy "create own blocks" on public.blocks for insert to authenticated with check(auth.uid()=blocker_id);
create policy "delete own blocks" on public.blocks for delete to authenticated using(auth.uid()=blocker_id);
create policy "own location write" on public.locations for insert to authenticated with check(auth.uid()=user_id);
create policy "own location update" on public.locations for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

create or replace function public.set_my_location(p_lat double precision,p_lng double precision,p_accuracy real default null,p_hidden boolean default false) returns void language plpgsql security definer set search_path=public as $$ declare last_update timestamptz; begin select updated_at into last_update from public.locations where user_id=auth.uid(); if last_update is not null and now()-last_update<interval '4 minutes' then raise exception 'location_rate_limited'; end if; insert into public.locations(user_id,lat,lng,accuracy_m,is_hidden,updated_at) values(auth.uid(),p_lat,p_lng,p_accuracy,p_hidden,now()) on conflict(user_id) do update set lat=excluded.lat,lng=excluded.lng,accuracy_m=excluded.accuracy_m,is_hidden=excluded.is_hidden,updated_at=now(); end; $$;

create or replace function public.get_visible_locations() returns table(user_id uuid,lat double precision,lng double precision,accuracy_m real,updated_at timestamptz,exact boolean) language sql security definer set search_path=public as $$
select l.user_id,case when(f1.follower_id is not null and f2.follower_id is not null) then l.lat else round(l.lat::numeric,3)::double precision end,case when(f1.follower_id is not null and f2.follower_id is not null) then l.lng else round(l.lng::numeric,3)::double precision end,l.accuracy_m,l.updated_at,(f1.follower_id is not null and f2.follower_id is not null)
from public.locations l join public.profiles p on p.id=l.user_id left join public.follows f1 on f1.follower_id=auth.uid() and f1.following_id=l.user_id left join public.follows f2 on f2.follower_id=l.user_id and f2.following_id=auth.uid()
where not l.is_hidden and l.user_id<>auth.uid() and not exists(select 1 from public.blocks b where(b.blocker_id=auth.uid() and b.blocked_id=l.user_id) or(b.blocker_id=l.user_id and b.blocked_id=auth.uid())) and (p.location_mode='always' or(p.location_mode='school_hours' and extract(isodow from now() at time zone 'Europe/London') between 1 and 5 and(now() at time zone 'Europe/London')::time between time '09:00' and time '16:40')) and p.visible_to<>'nobody' and(p.visible_to='friends_exact_others_approx' or(f1.follower_id is not null and f2.follower_id is not null)); $$;
grant execute on function public.set_my_location(double precision,double precision,real,boolean) to authenticated;
grant execute on function public.get_visible_locations() to authenticated;

create policy "own timetable" on public.timetables for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "group members read" on public.group_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.group_members gm where gm.group_id=group_members.group_id and gm.user_id=auth.uid()));
create policy "group member insert own" on public.group_members for insert to authenticated with check(user_id=auth.uid());
create policy "groups readable" on public.groups for select to authenticated using(true);
create policy "group owner create" on public.groups for insert to authenticated with check(auth.uid()=owner_id);
create policy "messages members" on public.messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid() or exists(select 1 from public.group_members gm where gm.group_id=messages.group_id and gm.user_id=auth.uid()));
create policy "messages send" on public.messages for insert to authenticated with check(sender_id=auth.uid());
create policy "push own" on public.push_subscriptions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create index if not exists locations_updated_at_idx on public.locations(updated_at desc);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists messages_recipient_idx on public.messages(recipient_id,created_at desc);
create index if not exists messages_group_idx on public.messages(group_id,created_at desc);