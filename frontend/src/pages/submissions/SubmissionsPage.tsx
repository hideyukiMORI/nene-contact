import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { SubmissionList } from '@/features/list-submissions';

export function SubmissionsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <section className="nc-card nc-section">
      <h1>{t('inbox.title')}</h1>
      <SubmissionList />
    </section>
  );
}
