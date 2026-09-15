-- Location privacy must remain true even when this migration is applied to an
-- already-provisioned project whose earlier grants were executed.
revoke select on table public.locations from authenticated;
revoke select on table public.locations from anon;