import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { clearAuthToken, setAuthToken } from '@/shared/api/client';
import type { Session } from '@/entities/auth';

// The admin session lives in app/ context (frontend-standards §E). The JWT is held in
// memory (fail-closed: re-login on reload); other storage would need an ADR.
interface AuthContextValue {
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = useCallback((next: Session) => {
    setAuthToken(next.token);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearAuthToken();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
