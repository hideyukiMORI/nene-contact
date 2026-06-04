import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';

export function SubmissionList(): ReactNode {
  const { t } = useI18n();
  const { submissions, isLoading, error, refetch, page, pageCount, goTo } = useSubmissions();

  if (isLoading) {
    return <p>{t('common.loading')}</p>;
  }

  if (error !== null) {
    return (
      <div className="nc-stack">
        <Alert>{t('inbox.error')}</Alert>
        <Button type="button" onClick={refetch}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return <p className="nc-muted">{t('inbox.empty')}</p>;
  }

  return (
    <div className="nc-section">
      <table className="nc-table">
        <thead>
          <tr>
            <th>{t('inbox.column.id')}</th>
            <th>{t('inbox.column.form')}</th>
            <th>{t('inbox.column.status')}</th>
            <th>{t('inbox.column.submittedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>{submission.id}</td>
              <td>{submission.contactFormId}</td>
              <td>{submission.status}</td>
              <td>{submission.submittedAt ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="nc-nav">
        <Button
          type="button"
          disabled={page <= 1}
          onClick={() => {
            goTo(page - 1);
          }}
        >
          {t('common.prev')}
        </Button>
        <span className="nc-muted">
          {t('inbox.page', { page: String(page), pages: String(pageCount) })}
        </span>
        <Button
          type="button"
          disabled={page >= pageCount}
          onClick={() => {
            goTo(page + 1);
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
