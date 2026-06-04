import { useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@/entities/auth';
import { useI18n } from '@/shared/i18n';

export function HomePage(): ReactNode {
  const { t } = useI18n();
  const { session } = useOutletContext<{ session: Session }>();

  return (
    <section className="nc-card nc-section">
      <h1>{t('home.title')}</h1>
      <p>{t('home.welcome', { email: session.email })}</p>
      <p className="nc-muted">{t('home.role', { role: session.role })}</p>
      <p className="nc-muted">{t('home.placeholder')}</p>
    </section>
  );
}
