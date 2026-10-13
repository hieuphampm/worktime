import type { APIRoute } from 'astro';
import { userClient } from '../../../lib/supabase/server';
import { sameOrigin } from '../../../lib/http';
export const prerender = false;
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return new Response(null, { status: 403 });
  await userClient(context).auth.signOut();
  return context.redirect('/login', 303);
};
