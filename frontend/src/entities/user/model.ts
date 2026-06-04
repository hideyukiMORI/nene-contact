export type UserRole = 'superadmin' | 'admin' | 'editor';
export type AssignableRole = 'admin' | 'editor';
export type UserStatus = 'active' | 'disabled';

export const ASSIGNABLE_ROLES: AssignableRole[] = ['admin', 'editor'];
export const USER_STATUSES: UserStatus[] = ['active', 'disabled'];

export interface User {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: AssignableRole;
}

export interface UpdateUserInput {
  role?: AssignableRole;
  status?: UserStatus;
}
