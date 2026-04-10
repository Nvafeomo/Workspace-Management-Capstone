create extension if not exists pgcrypto;

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_feedback'
      and column_name = 'submitter_name'
  ) or exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_feedback'
      and column_name = 'submitter_user_id'
  ) then
    execute 'update public.user_feedback set submitter_name = ''Anonymous'', submitter_user_id = null';

    execute 'alter table public.user_feedback drop column if exists submitter_name';
    execute 'alter table public.user_feedback drop column if exists submitter_user_id';
  end if;
end $$;

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