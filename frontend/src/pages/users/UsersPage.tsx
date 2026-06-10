import { useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { ManageUsers } from '@/features/manage-users';

export function UsersPage(): ReactNode {
  const { session } = useOutletContext<{ session: Session }>();
  return <ManageUsers currentEmail={session.email} />;
}
