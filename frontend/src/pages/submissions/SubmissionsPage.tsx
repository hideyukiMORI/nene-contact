import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { SubmissionList } from '@/features/list-submissions';

export function SubmissionsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <>
      <div className="page-head">
        <h1>{t('inbox.title')}</h1>
        <p className="lead">{t('inbox.lead')}</p>
      </div>
      <SubmissionList />
    </>
  );
}
