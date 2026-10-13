create or replace function private.set_attendance_duration_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.check_in_at is not null and new.check_out_at is not null then
    new.working_duration_minutes := floor(extract(epoch from (new.check_out_at - new.check_in_at)) / 60)::integer;
    if new.working_duration_minutes >= 540 then
      new.status := 'FULL_DAY';
      new.attendance_credit := 1.0;
    else
      new.status := 'HALF_DAY';
      new.attendance_credit := 0.5;
    end if;
  end if;
  return new;
end;
$$;

create trigger attendance_duration_status
before insert or update on public.attendance
for each row execute function private.set_attendance_duration_status();

update public.attendance
set updated_at = updated_at
where check_in_at is not null and check_out_at is not null;
