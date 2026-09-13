-- Run after supabase/schema.sql.
revoke all on function public.is_group_member(uuid,uuid) from public;
revoke all on function public.my_community() from public;
revoke all on function public.group_community(uuid) from public;
revoke all on function public.set_my_location(double precision,double precision,real,boolean) from public;
revoke all on function public.get_visible_locations() from public;
grant execute on function public.is_group_member(uuid,uuid) to authenticated;
grant execute on function public.my_community() to authenticated;
grant execute on function public.group_community(uuid) to authenticated;
grant execute on function public.set_my_location(double precision,double precision,real,boolean) to authenticated;
grant execute on function public.get_visible_locations() to authenticated;

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update to authenticated
using (auth.uid()=id)
with check (auth.uid()=id and community=public.my_community());
