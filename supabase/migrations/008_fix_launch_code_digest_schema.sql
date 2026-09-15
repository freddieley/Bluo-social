-- schema.sql installs pgcrypto with no schema clause, so it can end up in `public`
-- instead of `extensions`. 004's validate_launch_code hardcoded extensions.digest(),
-- which then fails wherever pgcrypto actually landed. Resolve digest() via search_path
-- instead of a hardcoded schema so this works regardless of where the extension lives.

create extension if not exists pgcrypto;
create extension if not exists pgcrypto with schema extensions;

drop function if exists public.validate_launch_code(text);
create function public.validate_launch_code(p_code text)
returns boolean
language sql
security definer
stable
set search_path=public, extensions
as $$
  select exists (
    select 1
    from public.launch_access_codes
    where active
      and code_hash = encode(digest(lower(trim(coalesce(p_code,''))), 'sha256'),'hex')
  );
$$;
revoke all on function public.validate_launch_code(text) from public;
grant execute on function public.validate_launch_code(text) to anon, authenticated;
