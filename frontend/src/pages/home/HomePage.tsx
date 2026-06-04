import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui';

export function HomePage({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}): ReactNode {
  const { t } = useI18n();

  return (
    <div className="nc-center">
      <div className="nc-card nc-stack">
        <h1>{t('home.title')}</h1>
        <p>{t('home.welcome', { email: session.email })}</p>
        <p className="nc-muted">{t('home.role', { role: session.role })}</p>
        <p className="nc-muted">{t('home.placeholder')}</p>
        <Button type="button" onClick={onSignOut}>
          {t('common.signOut')}
        </Button>
      </div>
    </div>
  );
}
