-- University platform upgrade
-- Run this in Supabase Dashboard → SQL Editor (run as a single script).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- Existing workspaces become type EQUIPMENT; borrow flows are unchanged.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Departments (schools, colleges, admin units)
-- ---------------------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Extend workspaces for rooms, labs, and equipment pools
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists workspace_type text not null default 'EQUIPMENT';

alter table public.workspaces
  add column if not exists department_id uuid references public.departments(id) on delete set null;

alter table public.workspaces
  add column if not exists building text;

alter table public.workspaces
  add column if not exists room_number text;

alter table public.workspaces
  add column if not exists capacity integer;

alter table public.workspaces
  add column if not exists min_booking_minutes integer not null default 30;

alter table public.workspaces
  add column if not exists max_booking_minutes integer not null default 480;

alter table public.workspaces
  add column if not exists reservation_requires_approval boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_workspace_type_check'
  ) then
    alter table public.workspaces
      add constraint workspaces_workspace_type_check
      check (workspace_type in ('ROOM', 'LAB', 'EQUIPMENT'));
  end if;
end $$;

create index if not exists idx_workspaces_department_id on public.workspaces(department_id);
create index if not exists idx_workspaces_workspace_type on public.workspaces(workspace_type);

-- ---------------------------------------------------------------------------
-- Time-based reservations for rooms and labs
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'CONFIRMED',
  purpose text,
  created_at timestamptz not null default now(),
  constraint reservations_time_order check (end_time > start_time),
  constraint reservations_status_check check (
    status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED')
  )
);

create index if not exists idx_reservations_workspace_id on public.reservations(workspace_id);
create index if not exists idx_reservations_user_id on public.reservations(user_id);
create index if not exists idx_reservations_time_range on public.reservations(workspace_id, start_time, end_time);

-- Prevent overlapping confirmed/pending bookings for the same workspace
alter table public.reservations drop constraint if exists reservations_no_overlap;
alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    workspace_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status in ('PENDING', 'CONFIRMED'));

-- ---------------------------------------------------------------------------
-- Conflict check helper
-- ---------------------------------------------------------------------------
create or replace function public.has_reservation_conflict(
  p_workspace_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.reservations r
    where r.workspace_id = p_workspace_id
      and r.status in ('PENDING', 'CONFIRMED')
      and (p_exclude_id is null or r.id <> p_exclude_id)
      and tstzrange(r.start_time, r.end_time, '[)') && tstzrange(p_start, p_end, '[)')
  );
$$;

-- ---------------------------------------------------------------------------
-- Create reservation (membership + duration + conflict checks)
-- ---------------------------------------------------------------------------
create or replace function public.create_reservation(
  p_workspace_id uuid,
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_purpose text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_membership public.workspace_users%rowtype;
  v_duration_minutes integer;
  v_status text;
  v_row public.reservations%rowtype;
begin
  if p_end <= p_start then
    raise exception 'End time must be after start time';
  end if;

  select * into v_workspace
  from public.workspaces
  where id = p_workspace_id;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_workspace.workspace_type not in ('ROOM', 'LAB') then
    raise exception 'This workspace does not accept reservations';
  end if;

  select * into v_membership
  from public.workspace_users
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and status in ('APPROVED', 'APPROVER_PENDING');

  if not found then
    if not exists (
      select 1 from public.users u
      where u.id = p_user_id and u.role = 'MASTER'
    ) then
      raise exception 'You must be an approved member to reserve this space';
    end if;
  end if;

  v_duration_minutes := extract(epoch from (p_end - p_start)) / 60;

  if v_duration_minutes < v_workspace.min_booking_minutes then
    raise exception 'Booking must be at least % minutes', v_workspace.min_booking_minutes;
  end if;

  if v_duration_minutes > v_workspace.max_booking_minutes then
    raise exception 'Booking cannot exceed % minutes', v_workspace.max_booking_minutes;
  end if;

  if public.has_reservation_conflict(p_workspace_id, p_start, p_end) then
    raise exception 'This time slot conflicts with an existing reservation';
  end if;

  v_status := case
    when v_workspace.reservation_requires_approval then 'PENDING'
    else 'CONFIRMED'
  end;

  insert into public.reservations (
    workspace_id, user_id, start_time, end_time, status, purpose
  )
  values (
    p_workspace_id, p_user_id, p_start, p_end, v_status, p_purpose
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Approve / reject reservation (workspace approvers+)
-- ---------------------------------------------------------------------------
create or replace function public.review_reservation(
  p_reservation_id uuid,
  p_reviewer_id uuid,
  p_decision text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_role text;
  v_global_role text;
begin
  if p_decision not in ('CONFIRMED', 'REJECTED') then
    raise exception 'Invalid decision';
  end if;

  select * into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found';
  end if;

  if v_reservation.status <> 'PENDING' then
    raise exception 'Only pending reservations can be reviewed';
  end if;

  select role into v_global_role from public.users where id = p_reviewer_id;

  select role into v_role
  from public.workspace_users
  where workspace_id = v_reservation.workspace_id
    and user_id = p_reviewer_id
    and status = 'APPROVED';

  if v_global_role <> 'MASTER'
     and coalesce(v_role, 'MEMBER') not in ('APPROVER', 'ADMIN', 'OWNER') then
    raise exception 'Not authorized to review this reservation';
  end if;

  if p_decision = 'CONFIRMED'
     and public.has_reservation_conflict(
       v_reservation.workspace_id,
       v_reservation.start_time,
       v_reservation.end_time,
       v_reservation.id
     ) then
    raise exception 'Cannot confirm: time slot now conflicts with another booking';
  end if;

  update public.reservations
  set status = p_decision
  where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "departments_select_authenticated" on public.departments;
create policy "departments_select_authenticated"
on public.departments for select to authenticated using (true);

drop policy if exists "departments_insert_admin" on public.departments;
create policy "departments_insert_admin"
on public.departments for insert to authenticated
with check (
  exists (
    select 1 from public.users
    where id = auth.uid() and role in ('ADMIN', 'MASTER')
  )
);

drop policy if exists "departments_update_admin" on public.departments;
create policy "departments_update_admin"
on public.departments for update to authenticated
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and role in ('ADMIN', 'MASTER')
  )
);

drop policy if exists "reservations_select_member_or_own" on public.reservations;
create policy "reservations_select_member_or_own"
on public.reservations for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workspace_users wu
    where wu.workspace_id = reservations.workspace_id
      and wu.user_id = auth.uid()
      and wu.status in ('APPROVED', 'APPROVER_PENDING')
  )
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'MASTER'
  )
);

drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own"
on public.reservations for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "reservations_update_own_pending" on public.reservations;
create policy "reservations_update_own_pending"
on public.reservations for update to authenticated
using (
  user_id = auth.uid() and status in ('PENDING', 'CONFIRMED')
);

-- ---------------------------------------------------------------------------
-- Seed departments (edit or remove for your institution)
-- ---------------------------------------------------------------------------
insert into public.departments (name, code, description)
values
  ('Computer Science', 'CS', 'School of Computing'),
  ('Engineering', 'ENG', 'College of Engineering'),
  ('Library Services', 'LIB', 'Central library and study spaces'),
  ('Business Administration', 'BUS', 'School of Business'),
  ('Arts & Sciences', 'A&S', 'College of Arts and Sciences'),
  ('Mathematics', 'MATH', 'Department of Mathematics'),
  ('Physics', 'PHYS', 'Department of Physics'),
  ('Biology', 'BIO', 'Department of Biology'),
  ('Chemistry', 'CHEM', 'Department of Chemistry'),
  ('Nursing', 'NURS', 'School of Nursing'),
  ('Education', 'EDU', 'School of Education'),
  ('Student Life', 'STU', 'Student affairs and campus life'),
  ('Facilities Management', 'FAC', 'Buildings, maintenance, and campus operations')
on conflict (code) do nothing;

-- RPC execute grants (required for browser clients)
grant execute on function public.create_reservation(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.review_reservation(uuid, uuid, text) to authenticated;
grant execute on function public.has_reservation_conflict(uuid, timestamptz, timestamptz, uuid) to authenticated;
