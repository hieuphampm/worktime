export type AttendanceStatus = 'FULL_DAY' | 'HALF_DAY' | 'OFF';
export type Role = 'ADMIN' | 'EMPLOYEE';
export type Profile = {
  id: string; employee_id: string; display_name: string; email: string | null;
  role: Role; department: string | null; is_active: boolean; deleted_at: string | null; created_at: string; updated_at: string;
};
export type Attendance = {
  id: string; employee_id: string; attendance_date: string; check_in_at: string | null;
  check_out_at: string | null; status: AttendanceStatus | null; working_duration_minutes: number | null;
  attendance_credit: number | null; notes: string | null; correction_reason: string | null; created_at: string; updated_at: string;
  last_modified_by: string | null; profile?: Profile; last_modifier?: Profile | null;
};
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id'|'employee_id'|'display_name'|'role'>; Update: Partial<Profile>; Relationships: [] };
      attendance: { Row: Attendance; Insert: Partial<Attendance> & Pick<Attendance, 'employee_id'|'attendance_date'>; Update: Partial<Attendance>; Relationships: [
        { foreignKeyName: 'attendance_employee_id_fkey'; columns: ['employee_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        { foreignKeyName: 'attendance_last_modified_by_fkey'; columns: ['last_modified_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
      ] };
      attendance_audit_logs: { Row: { id:string; attendance_id:string|null; employee_id:string|null; changed_by:string|null; action:string; old_values:Record<string,unknown>|null; new_values:Record<string,unknown>|null; reason:string|null; created_at:string }; Insert: Record<string, unknown>; Update: never; Relationships: [
        { foreignKeyName:'attendance_audit_logs_employee_id_fkey';columns:['employee_id'];isOneToOne:false;referencedRelation:'profiles';referencedColumns:['id'] },
        { foreignKeyName:'attendance_audit_logs_changed_by_fkey';columns:['changed_by'];isOneToOne:false;referencedRelation:'profiles';referencedColumns:['id'] }
      ] };
      company_settings: { Row: CompanySettings; Insert: Partial<CompanySettings>; Update: Partial<CompanySettings>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { app_role: Role; attendance_status: AttendanceStatus };
    CompositeTypes: Record<string, never>;
  };
}
export type CompanySettings = {
  id: number; company_name: string; timezone: string; work_start_time: string;
  work_end_time: string; holidays: string[]; updated_at: string;
};
