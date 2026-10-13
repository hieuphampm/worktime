import { defineMiddleware } from 'astro:middleware';
import { userClient, serviceClient } from './lib/supabase/server';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.profile = null;
  const path = context.url.pathname;
  if (path.startsWith('/api/') || path.startsWith('/_astro/') || /\.[a-z0-9]{1,8}$/i.test(path)) return next();
  context.locals.supabase = userClient(context);
  const { data: { user } } = await context.locals.supabase.auth.getUser();
  context.locals.user = user;
  if (user) {
    const { data } = await serviceClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data?.is_active) context.locals.profile = data;
  }

  const publicPath = path === '/login' || path === '/unauthorized' || path === '/api/auth/login' || path === '/api/auth/logout';
  if (!publicPath && !context.locals.profile) return context.redirect('/login');
  if (context.locals.profile?.role === 'EMPLOYEE' && path.startsWith('/admin')) return context.redirect('/unauthorized');
  if (context.locals.profile?.role === 'ADMIN' && path === '/employee') return context.redirect('/admin');
  const response = await next();
  if (context.locals.profile) response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
