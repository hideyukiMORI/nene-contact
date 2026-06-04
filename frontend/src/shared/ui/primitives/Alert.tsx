import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="nc-alert nc-alert-error" role="alert">
      {children}
    </div>
  );
}
