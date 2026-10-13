create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('ADMIN', 'EMPLOYEE');
create type public.attendance_status as enum ('FULL_DAY', 'HALF_DAY', 'OFF');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text not null unique check (length(trim(employee_id)) between 1 and 32),
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  email text,
  role public.app_role not null default 'EMPLOYEE',
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id),
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status public.attendance_status,
  working_duration_minutes integer,
  attendance_credit numeric(3,1),
  notes text,
  correction_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_modified_by uuid references public.profiles(id),
  constraint attendance_one_per_company_day unique(employee_id, attendance_date),
  constraint attendance_checkout_after_checkin check (check_out_at is null or (check_in_at is not null and check_out_at >= check_in_at)),
  constraint attendance_duration_nonnegative check (working_duration_minutes is null or working_duration_minutes >= 0),
  constraint attendance_credit_matches_status check (
    (status is null and attendance_credit is null) or
    (status = 'FULL_DAY' and attendance_credit = 1.0) or
    (status = 'HALF_DAY' and attendance_credit = 0.5) or
    (status = 'OFF' and attendance_credit = 0.0)
  ),
  constraint attendance_notes_size check (notes is null or length(notes) <= 2000)
);

create table public.attendance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.attendance(id) on delete set null,
  employee_id uuid references public.profiles(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('CHECK_IN', 'CHECK_OUT', 'ADMIN_CREATE', 'ADMIN_UPDATE', 'ADMIN_DELETE')),
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table public.company_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default 'Công ty' check (length(trim(company_name)) between 1 and 160),
  timezone text not null default 'Asia/Ho_Chi_Minh',
  work_start_time time not null default '08:00',
  work_end_time time not null default '17:00',
  holidays date[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint settings_timezone_nonempty check (length(trim(timezone)) > 0)
);
insert into public.company_settings(id) values (1) on conflict do nothing;

create index attendance_date_idx on public.attendance(attendance_date desc);
create index attendance_status_date_idx on public.attendance(status, attendance_date desc);
create index attendance_employee_date_idx on public.attendance(employee_id, attendance_date desc);
create index profiles_department_idx on public.profiles(department) where is_active;
create index audit_created_idx on public.attendance_audit_logs(created_at desc);
create index audit_employee_created_idx on public.attendance_audit_logs(employee_id, created_at desc);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ADMIN' and p.is_active);
$$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active);
$$;
revoke all on function private.is_active_user() from public, anon;
grant execute on function private.is_active_user() to authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger attendance_touch before update on public.attendance for each row execute function private.touch_updated_at();
create trigger settings_touch before update on public.company_settings for each row execute function private.touch_updated_at();

create or replace function private.capture_attendance_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid; actor_role public.app_role; event_action text;
begin
  if tg_op = 'DELETE' then
    actor := coalesce(old.last_modified_by, (select auth.uid()));
    insert into public.attendance_audit_logs(attendance_id, employee_id, changed_by, action, old_values)
    values (old.id, old.employee_id, actor, 'ADMIN_DELETE', to_jsonb(old));
    return old;
  elsif tg_op = 'INSERT' then
    actor := coalesce(new.last_modified_by, (select auth.uid()));
    insert into public.attendance_audit_logs(attendance_id, employee_id, changed_by, action, new_values, reason)
    values (new.id, new.employee_id, actor,
      case when new.check_in_at is not null then 'CHECK_IN' else 'ADMIN_CREATE' end, to_jsonb(new), new.correction_reason);
    return new;
  else
    actor := coalesce(new.last_modified_by, old.last_modified_by, (select auth.uid()));
    select p.role into actor_role from public.profiles p where p.id = actor;
    event_action := case when actor_role = 'EMPLOYEE' and old.check_in_at is null and new.check_in_at is not null then 'CHECK_IN'
                         when actor_role = 'EMPLOYEE' and old.check_out_at is null and new.check_out_at is not null then 'CHECK_OUT'
                         else 'ADMIN_UPDATE' end;
    insert into public.attendance_audit_logs(attendance_id, employee_id, changed_by, action, old_values, new_values, reason)
    values (new.id, new.employee_id, actor, event_action, to_jsonb(old), to_jsonb(new),
      case when event_action = 'ADMIN_UPDATE' then new.correction_reason else null end);
    return new;
  end if;
end;
$$;
revoke all on function private.capture_attendance_audit() from public, anon, authenticated;
create trigger attendance_audit after insert or update or delete on public.attendance
for each row execute function private.capture_attendance_audit();

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_audit_logs enable row level security;
alter table public.company_settings enable row level security;

grant select on public.profiles, public.attendance, public.attendance_audit_logs, public.company_settings to authenticated;
grant update (display_name, department) on public.profiles to authenticated;
create policy profiles_self_read on public.profiles for select to authenticated
using ((id = (select auth.uid()) and (select private.is_active_user())) or (select private.is_admin()));
create policy profiles_self_limited_update on public.profiles for update to authenticated
using (id = (select auth.uid()) and role = 'EMPLOYEE' and is_active)
with check (id = (select auth.uid()) and role = 'EMPLOYEE' and is_active);
create policy attendance_owner_or_admin_read on public.attendance for select to authenticated
using ((employee_id = (select auth.uid()) and (select private.is_active_user())) or (select private.is_admin()));
create policy audit_owner_or_admin_read on public.attendance_audit_logs for select to authenticated
using ((employee_id = (select auth.uid()) and (select private.is_active_user())) or (select private.is_admin()));
create policy settings_admin_read on public.company_settings for select to authenticated
using ((select private.is_admin()));
create policy settings_admin_update on public.company_settings for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

comment on table public.attendance is 'One row per employee and company-local date. The application determines attendance_date using company_settings.timezone; timestamps are stored as timestamptz.';
comment on column public.company_settings.holidays is 'Company-local holiday dates. Overnight shifts are represented by checkout on the following day; attendance_date remains the local date of check-in.';
