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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types';
const USERS_COLLECTION = 'users';
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
}
export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy('displayName'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
}
export async function getActiveEmployees(): Promise<UserProfile[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
}
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'department' | 'employeeId'>>
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}
export async function getActiveEmployeeCount(): Promise<number> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}
