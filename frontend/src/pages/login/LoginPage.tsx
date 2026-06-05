import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import { Login } from '@/features/login';
import { LoginIcon } from '@/features/login/ui/icons';
import type { LoginIconName } from '@/features/login/ui/icons';
import type { MessageKey } from '@/shared/i18n/messages/ja';

const FEATURES: { icon: LoginIconName; key: MessageKey }[] = [
  { icon: 'forms', key: 'login.aside.featureForms' },
  { icon: 'code', key: 'login.aside.featureEmbed' },
  { icon: 'inbox', key: 'login.aside.featureInbox' },
];

export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}): ReactNode {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="a-brand">
          <span className="a-mark">
            <LoginIcon name="send" size={22} />
          </span>
          <div className="a-name">
            NeNe Contact
            <small>{t('login.aside.console')}</small>
          </div>
        </div>

        <div className="a-hero">
          <div className="a-eyebrow">{t('login.aside.eyebrow')}</div>
          <h2>{t('login.aside.title')}</h2>
          <p>{t('login.aside.body')}</p>
          <ul className="a-features">
            {FEATURES.map((f) => (
              <li key={f.key}>
                <span className="fi">
                  <LoginIcon name={f.icon} size={15} />
                </span>
                {t(f.key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="a-foot">
          © {new Date().getFullYear()} NeNe Contact · {t('login.aside.footerTagline')}
        </div>
      </aside>

      <main className="auth-main">
        <div className="lang-toggle lang-fixed">
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

        <div className="auth-formwrap">
          <div className="auth-head">
            <div className="m-mark">
              <LoginIcon name="send" size={24} />
            </div>
            <h1>{t('login.welcome')}</h1>
            <p>{t('login.subtitle')}</p>
          </div>

          <Login onAuthenticated={onAuthenticated} />

          <p className="hint auth-account-hint">{t('login.accountHint')}</p>
        </div>
      </main>
    </div>
  );
}
