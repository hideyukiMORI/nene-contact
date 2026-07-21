import { Fragment, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { useI18n } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { useSubmissionsQuery } from '@/entities/submission';
import { BrandMark, Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import type { Session } from '@/entities/auth';
import type { MessageKey } from '@/shared/i18n/messages/ja';

// Pages read the session via react-router's Outlet context (no upward import of app/).
interface AdminOutletContext {
  session: Session;
}

interface NavLinkItem {
  to: string;
  end?: boolean;
  labelKey: MessageKey;
  icon: IconName;
  badge?: boolean;
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
      { to: '/submissions', labelKey: 'nav.inbox', icon: 'inbox', badge: true },
    ],
  },
  {
    labelKey: 'nav.group.manage',
    items: [
      { to: '/users', labelKey: 'nav.users', icon: 'users' },
      { to: '/settings/organization', labelKey: 'nav.orgSettings', icon: 'settings' },
      { to: '/service-tokens', labelKey: 'nav.serviceTokens', icon: 'link' },
      { to: '/audit-log', labelKey: 'nav.auditLog', icon: 'shield' },
    ],
  },
];

// Breadcrumbs derived from the current path; the final crumb is the current page.
function usePageCrumbs(): Crumb[] {
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
    if (segments[2] === 'edit') {
      return [{ label: t('nav.forms'), to: '/contact-forms' }, { label: t('contactForms.edit') }];
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
  if (segments[0] === 'service-tokens') {
    return [{ label: t('nav.serviceTokens') }];
  }
  if (segments[0] === 'audit-log') {
    return [{ label: t('nav.auditLog') }];
  }
  if (segments[0] === 'settings') {
    return [{ label: t('nav.orgSettings') }];
  }
  if (segments[0] === 'account') {
    return [{ label: t('account.title') }];
  }
  return [{ label: t('nav.dashboard') }];
}

export function ProtectedLayout(): ReactNode {
  const { session, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pageCrumbs = usePageCrumbs();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The inbox badge counts the unhandled submissions on the most recent page.
  const submissionsQuery = useSubmissionsQuery({ limit: 100, offset: 0 });
  const openCount = (submissionsQuery.data?.items ?? []).filter((s) => s.status === 'open').length;

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  const context: AdminOutletContext = { session };
  const initial = (session.email.at(0) ?? '?').toUpperCase();
  const isDark = theme === 'dark';
  const crumbs: Crumb[] = [{ label: t('crumb.home') }, ...pageCrumbs];

  // Full-screen focus (builder IA, 採用A): while editing a form, hide the host shell
  // (sidebar + breadcrumb + theme/lang/avatar). The builder owns the screen with its own
  // toolbar + tabs; `← 戻る` is the only exit back to the list.
  const fullscreen = /^\/contact-forms\/(new|[^/]+\/edit)$/.test(pathname);
  if (fullscreen) {
    return (
      <div className="ex-fullscreen">
        <Outlet context={context} />
      </div>
    );
  }

  return (
    <div className="ex-frame" data-drawer={drawerOpen ? 'open' : 'closed'}>
      <nav className="ex-nav">
        <div className="ex-brand">
          <span className="ex-brand-mark">
            <BrandMark size={34} />
          </span>
          <span className="ex-brand-text">
            <span className="ex-brand-name">NeNe Contact</span>
            <span className="ex-brand-sub">{t('common.console')}</span>
          </span>
        </div>

        {NAV_GROUPS.map((group) => (
          <Fragment key={group.labelKey}>
            <div className="ex-navgroup">{t(group.labelKey)}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) => 'ex-navitem' + (isActive ? ' on' : '')}
                onClick={() => {
                  setDrawerOpen(false);
                }}
              >
                <Icon name={item.icon} size={17} />
                <span className="ex-navlabel">{t(item.labelKey)}</span>
                {item.badge === true && openCount > 0 ? (
                  <span className="ex-navbadge">{openCount}</span>
                ) : null}
              </NavLink>
            ))}
          </Fragment>
        ))}

        <span className="ex-navspacer" />
        <div className="ex-navfoot">{t('nav.guideTour')}</div>
      </nav>

      <div className="ex-main">
        <header className="ex-topbar">
          <button
            type="button"
            className="ex-hamburger"
            aria-label={t('common.menu')}
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            <Icon name="more" size={18} />
          </button>
          <nav className="ex-crumb">
            {crumbs.map((crumb, i) => (
              <Fragment key={`${crumb.label}-${String(i)}`}>
                {i > 0 ? <span className="sep">›</span> : null}
                {crumb.to !== undefined && i < crumbs.length - 1 ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className={i === crumbs.length - 1 ? 'cur' : ''}>{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>

          <span className="ex-tspacer" />

          <div className="ex-chiprow">
            <button
              type="button"
              className="ex-ipill"
              onClick={toggleTheme}
              aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={15} />
            </button>

            <button type="button" className="ex-ipill" aria-label={t('common.help')}>
              <Icon name="help" size={15} />
            </button>

            <div className="ex-lang">
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

            <div className="ex-acct-wrap">
              <button
                type="button"
                className="ex-avatar"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((open) => !open);
                }}
              >
                {initial}
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="ex-menu-backdrop"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                  />
                  <div className="mn-pop mn-acct" role="menu">
                    <div className="mn-ahead">
                      <span className="mn-av">{initial}</span>
                      <div>
                        <div className="nm">{session.email}</div>
                        <div className="em">{t('home.role', { role: session.role })}</div>
                      </div>
                    </div>
                    <div className="mn-list">
                      <Link
                        to="/account"
                        className="mn-item"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                      >
                        <Icon name="user" size={16} />
                        {t('account.title')}
                      </Link>
                      <div className="mn-sep" />
                      <button
                        type="button"
                        className="mn-item danger"
                        role="menuitem"
                        onClick={signOut}
                      >
                        <Icon name="logout" size={16} />
                        {t('common.signOut')}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="ex-content">
          <Outlet context={context} />
        </main>
      </div>

      <button
        type="button"
        className="ex-scrim"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => {
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
