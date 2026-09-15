-- 008 revoked execute from PUBLIC and only re-granted to anon/authenticated, so the
-- signup route (which calls validate_launch_code using the service_role key) got
-- "permission denied for function validate_launch_code". Re-run this even if 008
-- already executed on this project.

grant execute on function public.validate_launch_code(text) to service_role;
