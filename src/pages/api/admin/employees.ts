import type { APIRoute } from 'astro';
import { requireAdmin, serviceClient } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';
import { z } from 'zod';

export const prerender = false;
const schema = z.object({ email: z.email().max(254), password: z.string().min(12).max(128), employee_id: z.string().trim().min(1).max(32), display_name: z.string().trim().min(1).max(120), department: z.string().trim().max(100).optional(), role: z.enum(['ADMIN','EMPLOYEE']).default('EMPLOYEE') });
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;
  let createdId: string | undefined;
  const db = serviceClient();
  try {
    const input = schema.parse(await body(context.request));
    const { data: userData, error: createError } = await db.auth.admin.createUser({ email: input.email.toLowerCase(), password: input.password, email_confirm: true });
    if (createError || !userData.user) throw createError || new Error('Không thể tạo tài khoản');
    createdId = userData.user.id;
    const { error } = await db.from('profiles').insert({ id: createdId, employee_id: input.employee_id, display_name: input.display_name, email: input.email.toLowerCase(), role: input.role, department: input.department || null });
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    if (createdId) await db.auth.admin.deleteUser(createdId);
    return json({ error: safeError(error) }, 400);
  }
};

export const PATCH: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;
  try {
    const input = z.object({ id: z.uuid(), employee_id: z.string().trim().min(1).max(32), display_name: z.string().trim().min(1).max(120), department: z.string().trim().max(100).nullable(), is_active: z.boolean(), password: z.string().min(12).max(128).optional() }).parse(await body(context.request));
    if (input.id === auth.user!.id && !input.is_active) return json({ error: 'Không thể tự vô hiệu hóa tài khoản đang sử dụng.' }, 400);
    const db=serviceClient();
    const profileUpdate={employee_id:input.employee_id,display_name:input.display_name,department:input.department,is_active:input.is_active};
    const updateAuth=async(ban_duration?:string)=>{
      const attributes={...(ban_duration?{ban_duration}:{}),...(input.password?{password:input.password}:{})};
      if(!Object.keys(attributes).length)return;
      const {error}=await db.auth.admin.updateUserById(input.id,attributes);
      if(error)throw error;
    };
    if(!input.is_active){
      const {error}=await db.from('profiles').update(profileUpdate).eq('id',input.id);if(error)throw error;
      await updateAuth('876000h');
    } else {
      await updateAuth('none');
      const {error}=await db.from('profiles').update(profileUpdate).eq('id',input.id);if(error)throw error;
    }
    return json({ ok: true });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
