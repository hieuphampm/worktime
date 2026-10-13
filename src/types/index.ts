import { Timestamp } from 'firebase/firestore';

export const UserRole = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AttendanceStatus = { FULL_DAY: 'FULL_DAY', HALF_DAY: 'HALF_DAY', OFF: 'OFF' } as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE_STATUS: 'UPDATE_STATUS',
  UPDATE_CHECKIN: 'UPDATE_CHECKIN',
  UPDATE_CHECKOUT: 'UPDATE_CHECKOUT',
  UPDATE_NOTES: 'UPDATE_NOTES',
  ADMIN_EDIT: 'ADMIN_EDIT',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface UserProfile {
  uid: string;
  employeeId: string;
  displayName: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export const UserProfile = {};

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInAt: Timestamp | null;
  checkOutAt: Timestamp | null;
  status: AttendanceStatus;
  workingDurationMinutes: number | null;
  attendanceCredit: number;
  notes: string;
  isComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedBy: string | null;
}
export const AttendanceRecord = {};

export interface AuditLogEntry {
  id: string;
  attendanceId: string;
  employeeId: string;
  changedBy: string;
  changedByName: string;
  action: AuditAction;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  reason: string;
  createdAt: Timestamp;
}
export const AuditLogEntry = {};

export interface CompanySettings {
  timezone: string;
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string; // HH:mm
  fullDayMinHours: number;
  halfDayMinHours: number;
  companyName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export const CompanySettings = {};

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  FULL_DAY: 'Đủ công',
  HALF_DAY: 'Nửa buổi',
  OFF: 'Off',
};

export const STATUS_CREDITS: Record<AttendanceStatus, number> = {
  FULL_DAY: 1.0,
  HALF_DAY: 0.5,
  OFF: 0.0,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  EMPLOYEE: 'Nhân viên',
};
