import { describe, expect, it } from 'vitest';
import { companyDate, companyLocalToIso, creditFor, excelDateInTimezone, minutesBetween } from '../src/lib/attendance';
import { authorizeRole, prepareAdminCorrection, prepareAdminCreate, prepareCheckIn, prepareCheckOut } from '../src/lib/attendance-rules';
import type { Attendance } from '../src/lib/database.types';

const base: Attendance = {
  id:'a',employee_id:'employee-1',attendance_date:'2026-10-13',check_in_at:'2026-10-13T01:00:00.000Z',check_out_at:null,status:null,
  working_duration_minutes:null,attendance_credit:null,notes:null,correction_reason:null,created_at:'',updated_at:'',last_modified_by:null,
};

describe('company time and attendance rules',()=>{
  it('uses the configured company timezone for the work date',()=>{
    expect(companyDate(new Date('2026-10-12T17:30:00.000Z'),'Asia/Ho_Chi_Minh')).toBe('2026-10-13');
  });
  it('converts administrative local clock values through the configured timezone',()=>{
    expect(companyLocalToIso('2026-10-13T08:00','Asia/Ho_Chi_Minh')).toBe('2026-10-13T01:00:00.000Z');
  });
  it('keeps exported clock values in the company timezone',()=>{
    const date=excelDateInTimezone('2026-10-13T01:00:00.000Z','Asia/Ho_Chi_Minh');
    expect(date.toISOString()).toBe('2026-10-13T08:00:00.000Z');
  });
  it('maps the only supported statuses to their credits',()=>{
    expect(['FULL_DAY','HALF_DAY','OFF'].map((s)=>creditFor(s as 'FULL_DAY'|'HALF_DAY'|'OFF'))).toEqual([1,0.5,0]);
  });
  it('prevents duplicate check-in and requires check-in before check-out',()=>{
    expect(prepareCheckIn(null,'employee-1','2026-10-13','2026-10-13T01:00:00Z').insert?.employee_id).toBe('employee-1');
    expect(()=>prepareCheckIn(base,'employee-1','2026-10-13','2026-10-13T01:00:00Z')).toThrow(/đã chấm công vào/);
    const statusOnly={...base,check_in_at:null,status:'OFF' as const,attendance_credit:0};
    expect(prepareCheckIn(statusOnly,'employee-1','2026-10-13','2026-10-13T01:00:00Z').existingId).toBe('a');
    expect(()=>prepareCheckOut(null,'employee-1','2026-10-13T09:00:00Z')).toThrow(/chấm công vào trước/);
  });
  it('allows one checkout and calculates duration, including overnight work',()=>{
    const overnight={...base,check_in_at:'2026-10-13T15:00:00.000Z'};
    const checkout=prepareCheckOut(overnight,'employee-1','2026-10-14T00:00:00.000Z');
    expect(checkout.working_duration_minutes).toBe(540);
    expect(()=>prepareCheckOut({...base,check_out_at:'2026-10-13T09:00:00Z'},'employee-1','2026-10-13T09:00:00Z')).toThrow(/đã chấm công ra/);
  });
  it('keeps admin status corrections independent from timestamps and requires a reason',()=>{
    const correction=prepareAdminCorrection({status:'OFF',checkIn:null,checkOut:null,notes:null,reason:'Nghỉ phép',actor:'admin-1'});
    expect(correction.attendance_credit).toBe(0); expect(correction.check_in_at).toBeNull();
    expect(()=>prepareAdminCorrection({status:'HALF_DAY',checkIn:'2026-10-13T10:00:00Z',checkOut:'2026-10-13T09:00:00Z',notes:null,reason:'Sai giờ',actor:'admin-1'})).toThrow(/phải sau/);
  });
  it('lets admins create status-only records with the correct credit and audit reason',()=>{
    const row=prepareAdminCreate({employee:'employee-1',date:'2026-10-13',status:'OFF',notes:'Ngày nghỉ',reason:'Ngày lễ công ty',actor:'admin-1'});
    expect(row.attendance_credit).toBe(0);expect(row.status).toBe('OFF');expect(row.last_modified_by).toBe('admin-1');expect(row.correction_reason).toBe('Ngày lễ công ty');
    expect(row).not.toHaveProperty('check_in_at');
  });
  it('authorizes only the stored role required by the route',()=>{
    expect(authorizeRole('ADMIN','ADMIN')).toBe(true); expect(authorizeRole('EMPLOYEE','ADMIN')).toBe(false); expect(authorizeRole(undefined,'EMPLOYEE')).toBe(false);
  });
  it('calculates nonnegative whole-minute durations',()=>expect(minutesBetween('2026-10-13T01:00:00Z','2026-10-13T02:04:59Z')).toBe(64));
});
