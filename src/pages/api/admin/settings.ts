import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAdmin, serviceClient } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';

export const prerender = false;
export const PATCH: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;
  try {
    const input = z.object({ company_name: z.string().trim().min(1).max(160), timezone: z.string().trim().min(1).max(80), work_start_time: z.string().regex(/^\d{2}:\d{2}$/), work_end_time: z.string().regex(/^\d{2}:\d{2}$/), holidays: z.array(z.iso.date()).max(100) }).parse(await body(context.request));
    new Intl.DateTimeFormat('en', { timeZone: input.timezone });
    const { error } = await serviceClient().from('company_settings').update(input).eq('id', 1);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
