import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { UserRole } from '../types';

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  employeeId: string;
  role: UserRole;
  department: string;
}

interface CreateUserResponse {
  uid: string;
  message: string;
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const createUserFn = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, 'createUser');
  const result = await createUserFn(data);
  return result.data;
}

export async function resetUserPassword(uid: string, newPassword: string): Promise<void> {
  const resetPasswordFn = httpsCallable(functions, 'resetUserPassword');
  await resetPasswordFn({ uid, newPassword });
}

export async function toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
  const toggleStatusFn = httpsCallable(functions, 'toggleUserStatus');
  await toggleStatusFn({ uid, isActive });
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const updateRoleFn = httpsCallable(functions, 'updateUserRole');
  await updateRoleFn({ uid, role });
}
