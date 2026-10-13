import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLogEntry } from '../types';
const AUDIT_COLLECTION = 'attendance_audit_logs';
export async function createAuditLog(
  data: Omit<AuditLogEntry, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, AUDIT_COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
  });
}
export async function getAuditLogs(
  filters: {
    employeeId?: string;
    attendanceId?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  } = {}
): Promise<AuditLogEntry[]> {
  let constraints: any[] = [orderBy('createdAt', 'desc')];
  if (filters.employeeId) {
    constraints.push(where('employeeId', '==', filters.employeeId));
  }
  if (filters.attendanceId) {
    constraints.push(where('attendanceId', '==', filters.attendanceId));
  }
  if (filters.startDate) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
  }
  if (filters.endDate) {
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
  }
  if (filters.limitCount) {
    constraints.push(limit(filters.limitCount));
  }
  const q = query(collection(db, AUDIT_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
}
export async function getAuditLogsForAttendance(
  attendanceId: string
): Promise<AuditLogEntry[]> {
  const q = query(
    collection(db, AUDIT_COLLECTION),
    where('attendanceId', '==', attendanceId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
}
