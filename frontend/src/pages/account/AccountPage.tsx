import { useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import { ChangePassword } from '@/features/change-password';

// Self-service account screen (off the avatar menu). Shows the signed-in identity (read-only)
// and the password-change form. Scoped to the current user — no admin capability required.
export function AccountPage(): ReactNode {
  const { t } = useI18n();
  const { session } = useOutletContext<{ session: Session }>();

  return (
    <div className="fm-body">
      <div className="fm-head">
        <h1>{t('account.title')}</h1>
      </div>

      <div className="fm-card ex-card-pad">
        <div className="ex-cardhead">
          <h3>{t('account.identity')}</h3>
        </div>
        <dl className="ac-meta">
          <div>
            <dt>{t('account.email')}</dt>
            <dd>{session.email}</dd>
          </div>
          <div>
            <dt>{t('account.role')}</dt>
            <dd>{t(`user.role.${session.role}`)}</dd>
          </div>
        </dl>
      </div>

      <div className="fm-card ex-card-pad">
        <div className="ex-cardhead">
          <h3>{t('account.password.title')}</h3>
        </div>
        <p className="ac-lead">{t('account.password.lead')}</p>
        <ChangePassword />
      </div>
    </div>
  );
}
