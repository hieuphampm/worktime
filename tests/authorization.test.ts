import { beforeEach, describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { requireAdmin } from '../src/lib/supabase/server';

const context={} as APIContext;
describe('server-side authorization guard',()=>{
  let state:{user:null|{id:string};profile:null|Record<string,unknown>};
  let deps:Parameters<typeof requireAdmin>[1];
  beforeEach(()=>{
    state={user:null,profile:null};
    deps={
      userClient:(()=>({auth:{getUser:async()=>({data:{user:state.user},error:null})}})) as never,
      serviceClient:(()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:state.profile,error:null})})})})})) as never,
    };
  });
  it('rejects requests without an authenticated Supabase user',async()=>{
    const result=await requireAdmin(context,deps); expect(result.error?.status).toBe(401);
  });
  it('rejects an employee even when the user session is valid',async()=>{
    state.user={id:'employee-1'};state.profile={id:'employee-1',role:'EMPLOYEE',is_active:true};
    const result=await requireAdmin(context,deps);expect(result.error?.status).toBe(403);
  });
  it('allows only an active administrator profile from the trusted profile lookup',async()=>{
    state.user={id:'admin-1'};state.profile={id:'admin-1',role:'ADMIN',is_active:true};
    const result=await requireAdmin(context,deps);expect(result.error).toBeNull();expect(result.user?.id).toBe('admin-1');
  });
  it('rejects a disabled profile even when its auth session still exists',async()=>{
    state.user={id:'disabled-1'};state.profile={id:'disabled-1',role:'ADMIN',is_active:false};
    const result=await requireAdmin(context,deps);expect(result.error?.status).toBe(403);
  });
});
