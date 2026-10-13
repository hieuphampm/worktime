import { serviceClient } from './supabase/server';

export type AttendanceFilter = {
  from?: string; to?: string; employee?: string; department?: string;
  status?: string; search?: string; sort?: 'date'|'employee'|'status'; page?: number; pageSize?: number;
};

export async function attendancePage(filter: AttendanceFilter) {
  const db = serviceClient();
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
  let matchingIds: string[] | null = null;
  if (filter.department || filter.search) {
    let peopleQuery = db.from('profiles').select('id,employee_id,display_name,department').eq('role', 'EMPLOYEE');
    if (filter.department) peopleQuery = peopleQuery.eq('department', filter.department);
    if (filter.search) peopleQuery = peopleQuery.or(`employee_id.ilike.%${filter.search.replace(/[,%()]/g, '')}%,display_name.ilike.%${filter.search.replace(/[,%()]/g, '')}%`);
    const { data: people, error: peopleError } = await peopleQuery;
    if (peopleError) throw peopleError;
    matchingIds = (people || []).map((p) => p.id);
    if (!matchingIds.length) return { rows: [], total: 0, page, pageSize };
  }
  let query = db.from('attendance').select('*, profile:profiles!attendance_employee_id_fkey(id,employee_id,display_name,department), last_modifier:profiles!attendance_last_modified_by_fkey(display_name)', { count: 'exact' });
  if (filter.from) query = query.gte('attendance_date', filter.from);
  if (filter.to) query = query.lte('attendance_date', filter.to);
  if (filter.employee) query = query.eq('employee_id', filter.employee);
  if (filter.status) query = query.eq('status', filter.status as never);
  if (matchingIds) query = query.in('employee_id', matchingIds);
  if (filter.sort === 'employee') query = query.order('display_name', { referencedTable: 'profile', ascending: true });
  else if (filter.sort === 'status') query = query.order('status', { ascending: true });
  query = query.order('attendance_date', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0, page, pageSize };
}

export async function departments() {
  const { data, error } = await serviceClient().from('profiles').select('department').not('department', 'is', null).eq('is_active', true);
  if (error) throw error;
  return [...new Set((data || []).map((x) => x.department).filter((x): x is string => Boolean(x)))].sort();
}
