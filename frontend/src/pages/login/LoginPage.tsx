import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import { BrandMark, Icon } from '@/shared/ui';
import { Login } from '@/features/login';

type Variant = 'login' | 'signup' | 'reset';

// Auth is a standalone two-pane screen (deep-teal brand panel + form). Only `login`
// talks to the API; `signup` / `reset` (and the Google button) are non-functional
// design placeholders — flagged with a demo note — since the platform issues operator
// accounts via tools/create-user.php (no self-serve signup).
export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}): ReactNode {
  const { t, locale, setLocale } = useI18n();
  const [variant, setVariant] = useState<Variant>('login');

  return (
    <div className="au">
      <div className="au-lang ex-lang">
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

      <aside className="au-brand">
        <div className="au-mkrow">
          <span className="au-mk">
            <BrandMark size={34} />
          </span>
          <span className="au-name">NeNe Contact</span>
        </div>
        <div className="au-tag">{t('auth.tagline')}</div>
        <div className="au-foot">{t('auth.brandFoot')}</div>
      </aside>

      <main className="au-form">
        {variant === 'login' ? (
          <div className="au-box">
            <h1 className="au-h1">{t('login.welcome')}</h1>
            <div className="au-sub">{t('login.subtitle')}</div>
            <Login
              onAuthenticated={onAuthenticated}
              onForgot={() => {
                setVariant('reset');
              }}
            />
            <div className="au-div">{t('auth.or')}</div>
            <button type="button" className="au-alt">
              <Icon name="globe" size={16} />
              {t('auth.google')}
            </button>
            <div className="au-foot2">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                className="au-link"
                onClick={() => {
                  setVariant('signup');
                }}
              >
                {t('auth.signupLink')}
              </button>
            </div>
          </div>
        ) : null}

        {variant === 'signup' ? (
          <div className="au-box">
            <h1 className="au-h1">{t('auth.signupTitle')}</h1>
            <div className="au-sub">{t('auth.signupSub')}</div>
            <div className="au-note">{t('auth.demoNote')}</div>
            <div className="au-field">
              <label className="l" htmlFor="signup-name">
                {t('auth.name')}
              </label>
              <input
                id="signup-name"
                className="au-inp"
                type="text"
                placeholder={t('auth.namePh')}
              />
            </div>
            <div className="au-field">
              <label className="l" htmlFor="signup-email">
                {t('login.email')}
              </label>
              <input
                id="signup-email"
                className="au-inp"
                type="email"
                placeholder={t('auth.emailPh')}
              />
            </div>
            <div className="au-field">
              <label className="l" htmlFor="signup-password">
                {t('login.password')}
              </label>
              <input
                id="signup-password"
                className="au-inp"
                type="password"
                placeholder={t('auth.passwordHint')}
              />
            </div>
            <div className="au-check">
              <span className="au-cb on" aria-hidden="true">
                <Icon name="check" size={11} />
              </span>
              <span>{t('auth.agree')}</span>
            </div>
            <button type="button" className="au-btn" disabled>
              {t('auth.signupSubmit')}
            </button>
            <div className="au-foot2">
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                className="au-link"
                onClick={() => {
                  setVariant('login');
                }}
              >
                {t('auth.loginLink')}
              </button>
            </div>
          </div>
        ) : null}

        {variant === 'reset' ? (
          <div className="au-box">
            <h1 className="au-h1">{t('auth.resetTitle')}</h1>
            <div className="au-sub">{t('auth.resetSub')}</div>
            <div className="au-note">{t('auth.demoNote')}</div>
            <div className="au-field">
              <label className="l" htmlFor="reset-email">
                {t('login.email')}
              </label>
              <input
                id="reset-email"
                className="au-inp"
                type="email"
                placeholder={t('auth.emailPh')}
              />
            </div>
            <button type="button" className="au-btn" disabled>
              {t('auth.resetSubmit')}
            </button>
            <div className="au-foot2">
              <button
                type="button"
                className="au-back"
                onClick={() => {
                  setVariant('login');
                }}
              >
                <Icon name="arrowLeft" size={14} />
                {t('auth.backToLogin')}
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
