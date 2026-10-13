import type { APIRoute } from 'astro';
import { userClient } from '../../../lib/supabase/server';
import { body, json, sameOrigin, safeError } from '../../../lib/http';

export const prerender = false;
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: 'Yêu cầu không hợp lệ' }, 403);
  try {
    const { email, password } = await body<{ email: string; password: string }>(context.request);
    if (!email?.trim() || !password || password.length > 256) return json({ error: 'Vui lòng nhập email và mật khẩu hợp lệ' }, 400);
    const supabase = userClient(context);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return json({ error: 'Email hoặc mật khẩu không chính xác' }, 401);
    const { data: profile } = await (await import('../../../lib/supabase/server')).serviceClient().from('profiles').select('role,is_active').eq('id', data.user.id).maybeSingle();
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return json({ error: 'Tài khoản chưa được kích hoạt. Hãy liên hệ quản trị viên.' }, 403);
    }
    return json({ redirect: profile.role === 'ADMIN' ? '/admin' : '/employee' });
  } catch (error) { return json({ error: safeError(error) }, 400); }
};
