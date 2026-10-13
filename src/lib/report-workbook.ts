import ExcelJS from 'exceljs';
import type { AttendanceStatus } from './database.types';
import { statusLabels } from './attendance';
import { excelDateInTimezone } from './attendance';

export type ReportRow = {
  attendance_date: string; check_in_at: string | null; check_out_at: string | null;
  working_duration_minutes: number | null; status: AttendanceStatus | null; attendance_credit: number | null;
  notes: string | null; updated_at: string; employee_id: string; profile?: { employee_id: string; display_name: string; department: string | null } | null;
  last_modifier?: { display_name: string } | null;
};

export async function createAttendanceWorkbook(rows: ReportRow[], from: string | null, to: string | null, timezone = 'Asia/Ho_Chi_Minh') {
  const book = new ExcelJS.Workbook(); book.creator = 'Workday Attendance'; book.created = new Date();
  const sheet = book.addWorksheet('Chấm công', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header:'Mã nhân viên',key:'employeeId',width:17 },{ header:'Họ và tên',key:'name',width:25 },{ header:'Phòng ban',key:'department',width:20 },{ header:'Ngày chấm công',key:'date',width:17 },
    { header:'Giờ vào',key:'checkIn',width:14 },{ header:'Giờ ra',key:'checkOut',width:14 },{ header:'Thời lượng (phút)',key:'duration',width:20 },{ header:'Trạng thái',key:'status',width:17 },
    { header:'Công',key:'credit',width:10 },{ header:'Ghi chú',key:'notes',width:32 },{ header:'Người sửa cuối',key:'modifier',width:22 },{ header:'Sửa lúc',key:'updatedAt',width:22 },
  ];
  for (const row of rows) sheet.addRow({ employeeId:row.profile?.employee_id,name:row.profile?.display_name,department:row.profile?.department||'',date:row.attendance_date,checkIn:row.check_in_at?excelDateInTimezone(row.check_in_at,timezone):null,checkOut:row.check_out_at?excelDateInTimezone(row.check_out_at,timezone):null,duration:row.working_duration_minutes,status:row.status?statusLabels[row.status]:'Chưa phân loại',credit:row.attendance_credit,notes:row.notes,modifier:row.last_modifier?.display_name||'',updatedAt:excelDateInTimezone(row.updated_at,timezone) });
  sheet.getRow(1).height=28; sheet.getRow(1).eachCell((cell)=>{cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF245FC7'}};cell.alignment={vertical:'middle'};});
  sheet.autoFilter={from:'A1',to:'L1'}; sheet.getColumn('date').numFmt='yyyy-mm-dd'; sheet.getColumn('checkIn').numFmt='hh:mm'; sheet.getColumn('checkOut').numFmt='hh:mm'; sheet.getColumn('updatedAt').numFmt='yyyy-mm-dd hh:mm';
  const summary=book.addWorksheet('Tổng hợp');const full=rows.filter(r=>r.status==='FULL_DAY').length;const half=rows.filter(r=>r.status==='HALF_DAY').length;const off=rows.filter(r=>r.status==='OFF').length;
  summary.addRows([['BÁO CÁO CHẤM CÔNG'],['Kỳ báo cáo',`${from||'Tất cả'} — ${to||'Tất cả'}`],['Tổng ngày đủ công',full],['Tổng ngày nửa buổi',half],['Tổng ngày Off',off],['Tổng công',rows.reduce((sum,r)=>sum+Number(r.attendance_credit||0),0)],['Số nhân viên',new Set(rows.map(r=>r.employee_id)).size],['Số bản ghi',rows.length]]);
  summary.getColumn(1).width=27;summary.getColumn(2).width=36;summary.getRow(1).font={bold:true,size:16,color:{argb:'FF245FC7'}};
  return book;
}
