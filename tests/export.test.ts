import { describe, expect, it } from 'vitest';
import { createAttendanceWorkbook } from '../src/lib/report-workbook';

describe('attendance Excel export',()=>{
  it('creates detailed and summary worksheets with the right totals',async()=>{
    const workbook=await createAttendanceWorkbook([
      {attendance_date:'2026-10-01',check_in_at:'2026-10-01T01:00:00Z',check_out_at:'2026-10-01T09:00:00Z',working_duration_minutes:480,status:'FULL_DAY',attendance_credit:1,notes:null,updated_at:'2026-10-01T09:00:00Z',employee_id:'a',profile:{employee_id:'E001',display_name:'An',department:'Finance'}},
      {attendance_date:'2026-10-02',check_in_at:null,check_out_at:null,working_duration_minutes:null,status:'HALF_DAY',attendance_credit:0.5,notes:'Ca sáng',updated_at:'2026-10-02T09:00:00Z',employee_id:'a',profile:{employee_id:'E001',display_name:'An',department:'Finance'}},
      {attendance_date:'2026-10-03',check_in_at:null,check_out_at:null,working_duration_minutes:null,status:'OFF',attendance_credit:0,notes:null,updated_at:'2026-10-03T09:00:00Z',employee_id:'b',profile:{employee_id:'E002',display_name:'Bình',department:'Sales'}},
    ],'2026-10-01','2026-10-31');
    expect(workbook.worksheets.map((sheet)=>sheet.name)).toEqual(['Chấm công','Tổng hợp']);
    expect(workbook.getWorksheet('Chấm công')!.getRow(1).cellCount).toBe(12);
    expect(workbook.getWorksheet('Chấm công')!.getCell('H2').value).toBe('Đủ công');
    const summary=workbook.getWorksheet('Tổng hợp')!;
    expect(summary.getCell('B3').value).toBe(1); expect(summary.getCell('B4').value).toBe(1); expect(summary.getCell('B5').value).toBe(1);
    expect(summary.getCell('B6').value).toBe(1.5); expect(summary.getCell('B7').value).toBe(2);
    expect(workbook.getWorksheet('Chấm công')!.autoFilter).toBeDefined();
  });
});
