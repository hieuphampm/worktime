import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  Query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AttendanceRecord, AttendanceStatus, STATUS_CREDITS } from '../types';
import { getCurrentDate, calculateDuration } from '../utils/dateUtils';
const ATTENDANCE_COLLECTION = 'attendance';
export function getAttendanceDocId(employeeId: string, date: string): string {
  return `${employeeId}_${date}`;
}
export async function checkIn(employeeId: string, employeeName: string): Promise<void> {
  const today = getCurrentDate();
  const docId = getAttendanceDocId(employeeId, today);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.checkInAt) {
        throw new Error('Bạn đã chấm công vào ngày hôm nay rồi.');
      }
    }
    const now = Timestamp.now();
    const record: Omit<AttendanceRecord, 'id'> = {
      employeeId,
      employeeName,
      date: today,
      checkInAt: now,
      checkOutAt: null,
      status: 'FULL_DAY',
      workingDurationMinutes: null,
      attendanceCredit: STATUS_CREDITS.FULL_DAY,
      notes: '',
      isComplete: false,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: null,
    };
    transaction.set(docRef, record);
  });
}
export async function checkOut(employeeId: string): Promise<void> {
  const today = getCurrentDate();
  const docId = getAttendanceDocId(employeeId, today);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) {
      throw new Error('Bạn chưa chấm công vào hôm nay.');
    }
    const data = docSnap.data();
    if (!data.checkInAt) {
      throw new Error('Bạn chưa chấm công vào hôm nay.');
    }
    if (data.checkOutAt) {
      throw new Error('Bạn đã chấm công ra ngày hôm nay rồi.');
    }
    const now = Timestamp.now();
    const duration = calculateDuration(data.checkInAt, now);
    transaction.update(docRef, {
      checkOutAt: now,
      workingDurationMinutes: duration,
      isComplete: true,
      updatedAt: now,
    });
  });
}
export async function getTodayAttendance(
  employeeId: string
): Promise<AttendanceRecord | null> {
  const today = getCurrentDate();
  const docId = getAttendanceDocId(employeeId, today);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
}
export async function getEmployeeAttendanceHistory(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  let q: Query = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId),
    orderBy('date', 'desc')
  );
  if (startDate) {
    q = query(q, where('date', '>=', startDate));
  }
  if (endDate) {
    q = query(q, where('date', '<=', endDate));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
}
export interface AttendanceFilter {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  searchTerm?: string;
}
export const AttendanceFilter = {};
export async function getAllAttendance(
  filters: AttendanceFilter = {}
): Promise<AttendanceRecord[]> {
  let constraints: any[] = [orderBy('date', 'desc')];
  if (filters.employeeId) {
    constraints.push(where('employeeId', '==', filters.employeeId));
  }
  if (filters.startDate) {
    constraints.push(where('date', '>=', filters.startDate));
  }
  if (filters.endDate) {
    constraints.push(where('date', '<=', filters.endDate));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  const q = query(collection(db, ATTENDANCE_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  let records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  // Client-side search filter
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    records = records.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(term) ||
        r.employeeId.toLowerCase().includes(term)
    );
  }
  return records;
}
export async function adminUpdateAttendance(
  attendanceId: string,
  updates: {
    status?: AttendanceStatus;
    checkInAt?: Timestamp | null;
    checkOutAt?: Timestamp | null;
    notes?: string;
  },
  adminId: string
): Promise<void> {
  const docRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
    lastModifiedBy: adminId,
  };
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    updateData.attendanceCredit = STATUS_CREDITS[updates.status];
  }
  if (updates.checkInAt !== undefined) {
    updateData.checkInAt = updates.checkInAt;
  }
  if (updates.checkOutAt !== undefined) {
    updateData.checkOutAt = updates.checkOutAt;
    // Recalculate duration if both check-in and check-out are present
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const checkIn = updates.checkInAt ?? data.checkInAt;
      const checkOut = updates.checkOutAt;
      if (checkIn && checkOut) {
        updateData.workingDurationMinutes = calculateDuration(checkIn, checkOut);
        updateData.isComplete = true;
      }
    }
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes;
  }
  await updateDoc(docRef, updateData);
}
export async function getTodayStats(): Promise<{
  totalCheckedIn: number;
  totalCheckedOut: number;
  fullDay: number;
  halfDay: number;
  off: number;
  incomplete: number;
}> {
  const today = getCurrentDate();
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('date', '==', today)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map((doc) => doc.data());
  return {
    totalCheckedIn: records.filter((r) => r.checkInAt).length,
    totalCheckedOut: records.filter((r) => r.checkOutAt).length,
    fullDay: records.filter((r) => r.status === 'FULL_DAY').length,
    halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    off: records.filter((r) => r.status === 'OFF').length,
    incomplete: records.filter((r) => r.checkInAt && !r.checkOutAt).length,
  };
}
