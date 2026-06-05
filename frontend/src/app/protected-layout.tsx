import { Fragment, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { useI18n } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { useSubmissionsQuery } from '@/entities/submission';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { ShellIcon } from '@/app/shell-icons';
import type { ShellIconName } from '@/app/shell-icons';

// Pages read the session via react-router's Outlet context (no upward import of app/).
interface AdminOutletContext {
  session: Session;
}

interface NavLinkItem {
  to: string;
  end?: boolean;
  labelKey: MessageKey;
  icon: ShellIconName;
  badge?: number;
}

interface Crumb {
  label: string;
  to?: string;
}

const NAV_GROUPS: { labelKey: MessageKey; items: NavLinkItem[] }[] = [
  {
    labelKey: 'nav.group.main',
    items: [
      { to: '/', end: true, labelKey: 'nav.dashboard', icon: 'dashboard' },
      { to: '/contact-forms', labelKey: 'nav.forms', icon: 'forms' },
      { to: '/submissions', labelKey: 'nav.inbox', icon: 'inbox' },
    ],
  },
  {
    labelKey: 'nav.group.manage',
    items: [{ to: '/users', labelKey: 'nav.users', icon: 'users' }],
  },
];

// Breadcrumbs derived from the current path; the final crumb is the current page.
function useCrumbs(): Crumb[] {
  const { t } = useI18n();
  const segments = useLocation()
    .pathname.split('/')
    .filter((s) => s.length > 0);

  if (segments.length === 0) {
    return [{ label: t('nav.dashboard') }];
  }
  if (segments[0] === 'contact-forms') {
    if (segments[1] === 'new') {
      return [{ label: t('nav.forms'), to: '/contact-forms' }, { label: t('crumb.create') }];
    }
    if (segments[2] === 'channels') {
      return [{ label: t('nav.forms'), to: '/contact-forms' }, { label: t('crumb.notifications') }];
    }
    return [{ label: t('nav.forms') }];
  }
  if (segments[0] === 'submissions') {
    if (segments[1] !== undefined) {
      return [{ label: t('nav.inbox'), to: '/submissions' }, { label: `#${segments[1]}` }];
    }
    return [{ label: t('nav.inbox') }];
  }
  if (segments[0] === 'users') {
    return [{ label: t('nav.users') }];
  }
  return [{ label: t('nav.dashboard') }];
}

export function ProtectedLayout(): ReactNode {
  const { session, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const crumbs = useCrumbs();
  const [menuOpen, setMenuOpen] = useState(false);

  // The inbox badge counts the unhandled submissions on the most recent page.
  const submissionsQuery = useSubmissionsQuery({ limit: 100, offset: 0 });
  const openCount = (submissionsQuery.data?.items ?? []).filter((s) => s.status === 'open').length;

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  const context: AdminOutletContext = { session };
  const initial = (session.email.at(0) ?? '?').toUpperCase();
  const isDark = theme === 'dark';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <ShellIcon name="send" size={17} />
          </span>
          <span className="brand-text">
            <span className="brand-name">NeNe Contact</span>
            <span className="brand-sub">{t('common.console')}</span>
          </span>
        </div>

        {NAV_GROUPS.map((group) => (
          <Fragment key={group.labelKey}>
            <div className="nav-group-label">{t(group.labelKey)}</div>
            {group.items.map((item) => {
              const badge = item.to === '/submissions' ? openCount : 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? false}
                  className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
                >
                  <ShellIcon name={item.icon} className="nav-ico" />
                  <span className="nav-label">{t(item.labelKey)}</span>
                  {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
                </NavLink>
              );
            })}
          </Fragment>
        ))}

        <span className="nav-spacer" />
      </aside>

      <div className="main">
        <header className="topbar">
          <nav className="crumbs">
            {crumbs.map((crumb, i) => (
              <Fragment key={`${crumb.label}-${String(i)}`}>
                {i > 0 ? <ShellIcon name="chevRight" size={13} className="sep" /> : null}
                {crumb.to !== undefined && i < crumbs.length - 1 ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className={i === crumbs.length - 1 ? 'cur' : ''}>{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>

          <span className="topbar-spacer" />

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
          >
            <ShellIcon name={isDark ? 'sun' : 'moon'} />
          </button>

          <div className="lang-toggle">
            <button
              type="button"
              className={locale === 'ja' ? 'on' : ''}
              onClick={() => {
                setLocale('ja');
              }}
            >
              日本語
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

          <div className="acct-wrap">
            <button
              type="button"
              className="acct"
              onClick={() => {
                setMenuOpen((open) => !open);
              }}
            >
              <span className="avatar">{initial}</span>
              <span className="acct-email">{session.email}</span>
              <ShellIcon name="chevDown" size={15} />
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="menu-backdrop"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                />
                <div className="card acct-menu">
                  <div className="acct-info">
                    <div className="nc-muted">{t('common.signedIn')}</div>
                    <div className="acct-name">{session.email}</div>
                    <div className="acct-role">{t('home.role', { role: session.role })}</div>
                  </div>
                  <div className="divider" />
                  <button type="button" className="menu-item" onClick={signOut}>
                    <ShellIcon name="logout" size={17} />
                    {t('common.signOut')}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <main className="page">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
