import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';
import { z } from 'zod';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  const auth = await requireUser(context);
  if (auth.error) return auth.error;
  try {
    const input = z.object({ current_password: z.string().min(1).max(256), new_password: z.string().min(6).max(128) }).parse(await body(context.request));
    if (input.current_password === input.new_password) return json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' }, 400);
    const { error } = await auth.supabase.auth.updateUser({ password: input.new_password, current_password: input.current_password });
    if (error) return json({ error: safeError(error) }, 400);
    return json({ ok: true });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
