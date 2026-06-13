export type Role = 'superadmin' | 'admin' | 'editor';

export interface Session {
  token: string;
  email: string;
  role: Role;
  orgId: number | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}
