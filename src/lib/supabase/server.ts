import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { APIContext } from 'astro';
import type { Database, Profile } from '../database.types';
import { publicEnv, serverEnv } from '../env';
import { authorizeRole } from '../attendance-rules';

export function userClient(context: APIContext) {
  const { url, key } = publicEnv();
  return createServerClient<Database>(url, key, {
    cookieOptions: { httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 },
    cookies: {
      getAll: () => (context.request.headers.get('cookie') || '').split(';').filter(Boolean).map((entry) => {
        const separator = entry.indexOf('=');
        return { name: entry.slice(0, separator).trim(), value: entry.slice(separator + 1).trim() };
      }),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => context.cookies.set(name, value, options)),
    },
  });
}

export function serviceClient() {
  const { url, secret } = serverEnv();
  return createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

type AuthDependencies = { userClient: typeof userClient; serviceClient: typeof serviceClient };

export async function requireUser(context: APIContext, dependencies: AuthDependencies = { userClient, serviceClient }) {
  const supabase = dependencies.userClient(context);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: Response.json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }, { status: 401 }), user: null, profile: null, supabase };
  const { data: profile, error: profileError } = await dependencies.serviceClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (profileError || !profile || !profile.is_active) return { error: Response.json({ error: 'Tài khoản không hoạt động hoặc không có hồ sơ truy cập.' }, { status: 403 }), user, profile: null, supabase };
  return { error: null, user, profile: profile as Profile, supabase };
}

export async function requireAdmin(context: APIContext, dependencies?: AuthDependencies) {
  const result = await requireUser(context, dependencies);
  if (result.error) return result;
  if (!authorizeRole(result.profile?.role, 'ADMIN')) return { ...result, error: Response.json({ error: 'Chỉ quản trị viên mới được phép thực hiện thao tác này.' }, { status: 403 }) };
  return result;
}
