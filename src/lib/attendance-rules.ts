import type { Attendance, AttendanceStatus } from './database.types';
import { creditFor, minutesBetween, statusForWorkDuration } from './attendance';

export function authorizeRole(role: string | undefined, required: 'ADMIN' | 'EMPLOYEE') {
  return role === required;
}

export function prepareCheckIn(current: Attendance | null, actor: string, date: string, now: string) {
  if (current?.check_in_at) throw new Error('Bạn đã chấm công vào cho ngày làm việc hôm nay.');
  if (current) return { existingId: current.id, update: { check_in_at: now, last_modified_by: actor }, insert: null };
  return { existingId: null, update: null, insert: { employee_id: actor, attendance_date: date, check_in_at: now, last_modified_by: actor } };
}

export function prepareCheckOut(current: Attendance | null, actor: string, now: string) {
  if (!current?.check_in_at) throw new Error('Bạn cần chấm công vào trước.');
  if (current.check_out_at) throw new Error('Bạn đã chấm công ra cho ngày làm việc hôm nay.');
  const workingDuration = minutesBetween(current.check_in_at, now);
  const status = statusForWorkDuration(workingDuration);
  return { check_out_at: now, working_duration_minutes: workingDuration, status, attendance_credit: creditFor(status), last_modified_by: actor };
}

export function prepareAdminCorrection(input: { status: AttendanceStatus | null; checkIn: string | null; checkOut: string | null; notes: string | null; reason: string; actor: string }) {
  if (input.reason.trim().length < 4) throw new Error('Lý do hiệu chỉnh phải có ít nhất 4 ký tự.');
  if (input.checkOut && (!input.checkIn || Date.parse(input.checkOut) < Date.parse(input.checkIn))) throw new Error('Thời điểm chấm công ra phải sau chấm công vào.');
  const workingDuration = input.checkIn && input.checkOut ? minutesBetween(input.checkIn, input.checkOut) : null;
  const status = workingDuration === null ? input.status : statusForWorkDuration(workingDuration);
  return { check_in_at: input.checkIn, check_out_at: input.checkOut,
    working_duration_minutes: workingDuration,
    status, attendance_credit: status ? creditFor(status) : null,
    notes: input.notes, correction_reason: input.reason.trim(), last_modified_by: input.actor };
}

export function prepareAdminCreate(input: { employee: string; date: string; status: AttendanceStatus; notes: string | null; reason: string; actor: string }) {
  if (input.reason.trim().length < 4) throw new Error('Lý do tạo bản ghi phải có ít nhất 4 ký tự.');
  return { employee_id:input.employee, attendance_date:input.date, status:input.status, attendance_credit:creditFor(input.status), notes:input.notes, correction_reason:input.reason.trim(), last_modified_by:input.actor };
}
