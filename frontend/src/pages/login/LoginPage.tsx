import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import { BrandMark } from '@/shared/ui';
import { Login } from '@/features/login';

// Standalone two-pane login screen (DirAC, design spec #272): a deep-teal brand panel with the
// origami "folded-paper" layer + large-serif display, paired with the editorial form kit. The
// folded facets radiate from an upper-right focal point and fade toward the copy via a mask.
export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}): ReactNode {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="exwrap pr acc-vt1 lp lp-ac">
      <div className="lp-ac__brand">
        <svg
          className="lp-ac__folds"
          viewBox="0 0 760 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <polygon points="706,128 0,150 0,372" fill="#fff" opacity="0.024" />
          <polygon points="706,128 0,372 0,566" fill="#000" opacity="0.032" />
          <polygon points="706,128 0,566 150,900 470,900" fill="#fff" opacity="0.016" />
          <polygon points="706,128 470,900 760,900 760,430" fill="#000" opacity="0.030" />
          <g stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round">
            <line x1="706" y1="128" x2="0" y2="372" opacity="0.11" />
            <line x1="706" y1="128" x2="0" y2="566" opacity="0.07" />
            <line x1="706" y1="128" x2="150" y2="900" opacity="0.09" />
            <line x1="706" y1="128" x2="470" y2="900" opacity="0.06" />
            <line x1="706" y1="128" x2="760" y2="430" opacity="0.05" />
          </g>
        </svg>

        <div className="lp-ac__top">
          <div className="lp-mark">
            <span className="lp-mark__tile">
              <BrandMark on size={38} />
            </span>
            <span className="lp-mark__name">NeNe Contact</span>
          </div>
          <span className="lp-ac__idx">{t('auth.idx')}</span>
        </div>

        <div className="lp-ac__mid">
          <div className="lp-ac__kicker">
            <span className="dot" />
            {t('auth.welcomeKicker')}
          </div>
          <h2 className="lp-ac__display">
            {t('auth.taglineLead')}
            <br />
            <span className="v">{t('auth.taglineAccent')}</span>
          </h2>
          <p className="lp-ac__lede">{t('auth.brandFoot')}</p>
        </div>

        <div className="lp-ac__trust lp-ac__trust--credit">
          <div className="t">
            {t('auth.poweredBy')} <b>NENE2</b> · 2026 © AYANE
          </div>
        </div>
      </div>

      <main className="lp-ac__form">
        <div className="lp-lang ex-lang">
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

        <Login onAuthenticated={onAuthenticated} />
      </main>
    </div>
  );
}
