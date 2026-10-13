import type { APIRoute } from 'astro';
import { requireUser, serviceClient } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';
import { companyDate } from '../../../lib/attendance';
import { serverEnv } from '../../../lib/env';
import { prepareCheckIn, prepareCheckOut } from '../../../lib/attendance-rules';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireUser(context);
  if (auth.error) return auth.error;
  if (auth.profile?.role !== 'EMPLOYEE') return json({ error: 'Không có quyền thực hiện thao tác này' }, 403);
  try {
    const { action } = await body<{ action: string }>(context.request);
    if (action !== 'check-in' && action !== 'check-out') return json({ error: 'Thao tác không hợp lệ' }, 400);
    const db = serviceClient();
    const { data: settings } = await db.from('company_settings').select('timezone').eq('id', 1).single();
    const date = companyDate(new Date(), settings?.timezone || serverEnv().timezone);
    const { data: current, error: readError } = await db.from('attendance').select('*').eq('employee_id', auth.user!.id).eq('attendance_date', date).maybeSingle();
    if (readError) throw readError;
    const now = new Date().toISOString();
    if (action === 'check-in') {
      let row;
      try { row = prepareCheckIn(current as never, auth.user!.id, date, now); }
      catch (error) { return json({ error: safeError(error) }, 409); }
      let error;
      if (row.existingId) {
        const { data: updated, error: updateError } = await db.from('attendance').update(row.update!).eq('id', row.existingId).is('check_in_at', null).select('id').maybeSingle();
        error = updateError;
        if (!error && !updated) return json({ error: 'Yêu cầu chấm công vào đã được xử lý.' }, 409);
      } else {
        const result = await db.from('attendance').insert(row.insert!);
        error = result.error;
      }
      if (error?.code === '23505') return json({ error: 'Yêu cầu chấm công đã được xử lý.' }, 409);
      if (error) throw error;
    } else {
      let update;
      try { update = prepareCheckOut(current as never, auth.user!.id, now); }
      catch (error) { return json({ error: safeError(error) }, 409); }
      const { data: updated, error } = await db.from('attendance').update(update).eq('id', current!.id).is('check_out_at', null).select('id').maybeSingle();
      if (error) throw error;
      if (!updated) return json({ error: 'Yêu cầu chấm công ra đã được xử lý.' }, 409);
    }
    return json({ ok: true, date });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
