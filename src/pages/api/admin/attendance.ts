import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAdmin, serviceClient } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';
import { companyLocalToIso } from '../../../lib/attendance';
import { prepareAdminCorrection, prepareAdminCreate } from '../../../lib/attendance-rules';

export const prerender = false;
const schema = z.object({ id: z.uuid(), check_in_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(), check_out_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(), status: z.enum(['FULL_DAY','HALF_DAY','OFF']).nullable(), notes: z.string().max(2000).nullable(), reason: z.string().trim().min(4).max(500) });
const createSchema = z.object({ employee_id:z.uuid(), attendance_date:z.iso.date(), status:z.enum(['FULL_DAY','HALF_DAY','OFF']), notes:z.string().max(2000).nullable(), reason:z.string().trim().min(4).max(500) });
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error:'Yêu cầu không hợp lệ' },403);
  const auth=await requireAdmin(context);if(auth.error)return auth.error;
  try {
    const input=createSchema.parse(await body(context.request));const db=serviceClient();
    const {data:employee,error:profileError}=await db.from('profiles').select('id').eq('id',input.employee_id).eq('role','EMPLOYEE').eq('is_active',true).maybeSingle();
    if(profileError)throw profileError;if(!employee)return json({error:'Không tìm thấy nhân viên đang hoạt động.'},404);
    const createRow=prepareAdminCreate({employee:input.employee_id,date:input.attendance_date,status:input.status,notes:input.notes,reason:input.reason,actor:auth.user!.id});
    const {error}=await db.from('attendance').insert(createRow);
    if(error?.code==='23505')return json({error:'Đã có bản ghi cho nhân viên và ngày này.'},409);if(error)throw error;
    return json({ok:true});
  } catch(error){return json({error:safeError(error)},400);}
};
export const PATCH: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;
  try {
    const input = schema.parse(await body(context.request));
    const db = serviceClient();
    const { data: settings } = await db.from('company_settings').select('timezone').eq('id',1).single();
    const timezone = settings?.timezone || 'Asia/Ho_Chi_Minh';
    const checkIn = input.check_in_at ? companyLocalToIso(input.check_in_at, timezone) : null;
    const checkOut = input.check_out_at ? companyLocalToIso(input.check_out_at, timezone) : null;
    let update;
    try { update = prepareAdminCorrection({ status:input.status, checkIn, checkOut, notes:input.notes, reason:input.reason, actor:auth.user!.id }); }
    catch (error) { return json({ error:safeError(error) },400); }
    const { data, error } = await db.from('attendance').update(update).eq('id', input.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return json({ error:'Không tìm thấy bản ghi chấm công.' },404);
    return json({ ok: true });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
