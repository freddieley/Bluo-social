-- Since college emails are not verified, students can flag suspected impersonation accounts.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

alter table public.reports enable row level security;
revoke all on public.reports from anon;
grant select, insert on public.reports to authenticated;

drop policy if exists "report own submissions" on public.reports;
create policy "report own submissions" on public.reports for select to authenticated using (reporter_id = auth.uid());
drop policy if exists "create own reports" on public.reports;
create policy "create own reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

create index if not exists reports_reported_idx on public.reports(reported_id);
