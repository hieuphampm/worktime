import type { APIRoute } from 'astro';
import { requireAdmin, serviceClient } from '../../../lib/supabase/server';
import { safeError } from '../../../lib/http';
import { createAttendanceWorkbook } from '../../../lib/report-workbook';
import { z } from 'zod';

export const prerender = false;
export const GET: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;
  try {
    const params = context.url.searchParams;
    const filters=z.object({from:z.iso.date().nullable(),to:z.iso.date().nullable(),employee:z.uuid().nullable(),status:z.enum(['FULL_DAY','HALF_DAY','OFF']).nullable(),department:z.string().max(100).nullable()}).safeParse({from:params.get('from'),to:params.get('to'),employee:params.get('employee'),status:params.get('status'),department:params.get('department')});
    if(!filters.success)return new Response('Bộ lọc báo cáo không hợp lệ',{status:400});
    const {from,to,employee,status,department}=filters.data;
    if(from&&to&&from>to)return new Response('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',{status:400});
    const db = serviceClient();
    const {data:departmentProfiles,error:departmentError}=department?await db.from('profiles').select('id').eq('role','EMPLOYEE').eq('department',department):{data:null,error:null};
    if(departmentError)throw departmentError;
    let rows: Awaited<ReturnType<typeof fetchAttendance>>=[];
    if(!department||departmentProfiles?.length){
      for(let offset=0;offset<=100000;offset+=1000){
        const batch=await fetchAttendance(db,{from,to,employee,status,ids:departmentProfiles?.map((p)=>p.id)||null,offset});
        if(offset===100000&&batch.length)return new Response('Báo cáo vượt quá giới hạn 100.000 bản ghi. Hãy chọn kỳ ngắn hơn.',{status:413});
        rows.push(...batch);
        if(batch.length<1000)break;
      }
    }
    const { data: settings } = await db.from('company_settings').select('timezone').eq('id',1).single();
    const book = await createAttendanceWorkbook(rows, from, to, settings?.timezone || 'Asia/Ho_Chi_Minh');
    const buf = await book.xlsx.writeBuffer();
    if (buf.byteLength > 4_300_000) return new Response('Tệp báo cáo quá lớn để tải trực tiếp. Hãy thu hẹp kỳ báo cáo hoặc chọn ít nhân viên hơn.', { status: 413 });
    const monthCandidate = from || new Intl.DateTimeFormat('en-CA',{timeZone:settings?.timezone||'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date());
    const month = /^\d{4}-\d{2}/.test(monthCandidate) ? monthCandidate.slice(0,7).replace('-', '_') : 'all_periods';
    return new Response(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="Attendance_Report_${month}.xlsx"`, 'Cache-Control': 'no-store' } });
  } catch (error) { return new Response(safeError(error), { status: 500 }); }
};

async function fetchAttendance(db:ReturnType<typeof serviceClient>,filters:{from:string|null;to:string|null;employee:string|null;status:string|null;ids:string[]|null;offset:number}){
  let query=db.from('attendance').select('*, profile:profiles!attendance_employee_id_fkey(employee_id,display_name,department), last_modifier:profiles!attendance_last_modified_by_fkey(display_name)').order('attendance_date',{ascending:true}).range(filters.offset,filters.offset+999);
  if(filters.from)query=query.gte('attendance_date',filters.from);
  if(filters.to)query=query.lte('attendance_date',filters.to);
  if(filters.employee)query=query.eq('employee_id',filters.employee);
  if(filters.status)query=query.eq('status',filters.status as never);
  if(filters.ids)query=query.in('employee_id',filters.ids);
  const {data,error}=await query;if(error)throw error;return data||[];
}
