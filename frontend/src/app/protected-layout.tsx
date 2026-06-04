import { Link, Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import type { Session } from '@/entities/auth';

// Pages read the session via react-router's Outlet context (no upward import of app/).
interface AdminOutletContext {
  session: Session;
}

export function ProtectedLayout(): ReactNode {
  const { session, signOut } = useAuth();
  const { t } = useI18n();

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  const context: AdminOutletContext = { session };

  return (
    <div className="nc-app">
      <nav className="nc-nav">
        <Link to="/">{t('nav.dashboard')}</Link>
        <Link to="/contact-forms">{t('nav.forms')}</Link>
        <Link to="/submissions">{t('nav.inbox')}</Link>
        <Link to="/users">{t('nav.users')}</Link>
        <span className="nc-nav-spacer" />
        <Button type="button" onClick={signOut}>
          {t('common.signOut')}
        </Button>
      </nav>
      <main className="nc-main">
        <Outlet context={context} />
      </main>
    </div>
  );
}
