-- Do not surface the normal location rate limit as an HTTP 400 from PostgREST.
-- The browser already polls location periodically, so a recent update is
-- expected and should be treated as a successful no-op rather than an error.
create or replace function public.set_my_location(
  p_lat double precision,
  p_lng double precision,
  p_accuracy real default null,
  p_hidden boolean default false
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  last_update timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_lat is null or p_lng is null
     or p_lat <> p_lat or p_lng <> p_lng
     or p_lat not between -90 and 90
     or p_lng not between -180 and 180 then
    raise exception 'invalid_location';
  end if;

  select updated_at into last_update
  from public.locations
  where user_id=auth.uid();

  if last_update is not null and now()-last_update < interval '4 minutes' then
    return;
  end if;

  insert into public.locations(user_id,lat,lng,accuracy_m,is_hidden,updated_at)
  values(auth.uid(),p_lat,p_lng,p_accuracy,p_hidden,now())
  on conflict(user_id) do update set
    lat=excluded.lat,
    lng=excluded.lng,
    accuracy_m=excluded.accuracy_m,
    is_hidden=excluded.is_hidden,
    updated_at=now();
end;
$$;

grant execute on function public.set_my_location(double precision,double precision,real,boolean) to authenticated;

-- Ask PostgREST to refresh its function schema cache after the replacement.
notify pgrst, 'reload schema';
