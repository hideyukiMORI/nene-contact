import { NavLink, Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { useI18n } from '@/shared/i18n';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';

// Pages read the session via react-router's Outlet context (no upward import of app/).
interface AdminOutletContext {
  session: Session;
}

function NavIcon({ d }: { d: string }): ReactNode {
  return (
    <svg
      className="nav-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const NAV: { to: string; end?: boolean; labelKey: MessageKey; icon: string }[] = [
  { to: '/', end: true, labelKey: 'nav.dashboard', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  {
    to: '/contact-forms',
    labelKey: 'nav.forms',
    icon: 'M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z',
  },
  { to: '/submissions', labelKey: 'nav.inbox', icon: 'M3 7l9 6 9-6M3 7v10h18V7' },
  {
    to: '/users',
    labelKey: 'nav.users',
    icon: 'M16 18v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
];

export function ProtectedLayout(): ReactNode {
  const { session, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  const context: AdminOutletContext = { session };
  const initial = (session.email.at(0) ?? '?').toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </span>
          <span>
            <span className="brand-name">NeNe Contact</span>
            <span className="brand-sub">{t('common.appName')}</span>
          </span>
        </div>

        <div className="nav-group-label">{t('nav.dashboard')}</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <NavIcon d={item.icon} />
            {t(item.labelKey)}
          </NavLink>
        ))}

        <span className="nav-spacer" />
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar-spacer" />
          <div className="lang-toggle">
            <button
              type="button"
              className={locale === 'ja' ? 'on' : ''}
              onClick={() => {
                setLocale('ja');
              }}
            >
              JA
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'on' : ''}
              onClick={() => {
                setLocale('en');
              }}
            >
              EN
            </button>
          </div>
          <span className="acct">
            <span className="avatar">{initial}</span>
            <span className="acct-email">{session.email}</span>
          </span>
          <button type="button" className="btn btn-sm" onClick={signOut}>
            {t('common.signOut')}
          </button>
        </header>
        <main className="page">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
