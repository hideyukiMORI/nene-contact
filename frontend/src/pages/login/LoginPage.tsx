import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { Login } from '@/features/login';

export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}): ReactNode {
  return (
    <div className="nc-center">
      <div className="nc-card nc-stack">
        <Login onAuthenticated={onAuthenticated} />
      </div>
    </div>
  );
}
