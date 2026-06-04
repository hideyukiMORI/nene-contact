import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { SubmissionDetail } from '@/features/view-submission';

export function SubmissionDetailPage(): ReactNode {
  const { t } = useI18n();
  const { id } = useParams();
  const submissionId = Number(id);

  return (
    <section className="nc-card nc-section">
      <Link to="/submissions">← {t('submission.back')}</Link>
      <h1>{t('submission.title', { id: String(submissionId) })}</h1>
      {Number.isNaN(submissionId) ? null : <SubmissionDetail submissionId={submissionId} />}
    </section>
  );
}
