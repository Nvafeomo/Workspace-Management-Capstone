create extension if not exists pgcrypto;

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  submitter_name text not null default 'Anonymous',
  submitter_user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.user_feedback
  add column if not exists submitter_name text not null default 'Anonymous';

alter table public.user_feedback
  add column if not exists submitter_user_id uuid;

alter table public.user_feedback enable row level security;

drop policy if exists "Allow feedback insert" on public.user_feedback;
create policy "Allow feedback insert"
on public.user_feedback
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow admins read feedback" on public.user_feedback;
create policy "Allow admins read feedback"
on public.user_feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role in ('ADMIN', 'MASTER')
  )
);

drop policy if exists "Allow admins delete feedback" on public.user_feedback;
create policy "Allow admins delete feedback"
on public.user_feedback
for delete
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role in ('ADMIN', 'MASTER')
  )
);