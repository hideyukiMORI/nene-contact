import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import type { SubmissionStatus } from '@/entities/submission';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';
import { InboxIcon } from '@/features/list-submissions/ui/icons';

function StatusBadge({ status }: { status: SubmissionStatus }): ReactNode {
  const { t } = useI18n();
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {t(`submission.status.${status}`)}
    </span>
  );
}

export function SubmissionList(): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { submissions, isLoading, error, refetch, page, pageCount, goTo } = useSubmissions();
  const formsQuery = useContactFormsQuery();

  const formName = (id: number): string => {
    const match = formsQuery.data?.items.find((f) => f.id === id);
    return match?.name ?? t('inbox.unknownForm', { id: String(id) });
  };

  if (isLoading) {
    return (
      <div className="card card-pad">
        <p className="faint">{t('common.loading')}</p>
      </div>
    );
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
    return (
      <div className="card">
        <div className="empty">
          <div className="e-ico">
            <InboxIcon name="inbox" size={26} />
          </div>
          <h3>{t('inbox.emptyTitle')}</h3>
          <p>{t('inbox.emptyBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>{t('inbox.column.form')}</th>
            <th>{t('inbox.column.status')}</th>
            <th className="col-right">{t('inbox.column.submittedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr
              key={submission.id}
              className="clickable"
              onClick={() => {
                void navigate(`/submissions/${String(submission.id)}`);
              }}
            >
              <td>
                <div className="cell-strong">{formName(submission.contactFormId)}</div>
                <div className="faint mono submission-id">#{submission.id}</div>
              </td>
              <td>
                <StatusBadge status={submission.status} />
              </td>
              <td className="cell-mute col-right">{submission.submittedAt ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-foot">
        <button
          type="button"
          className="btn btn-sm"
          disabled={page <= 1}
          onClick={() => {
            goTo(page - 1);
          }}
        >
          <InboxIcon name="chevLeft" size={14} />
          {t('common.prev')}
        </button>
        <span className="hint">
          {t('inbox.page', { page: String(page), pages: String(pageCount) })}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          disabled={page >= pageCount}
          onClick={() => {
            goTo(page + 1);
          }}
        >
          {t('common.next')}
          <InboxIcon name="chevRight" size={14} />
        </button>
      </div>
    </div>
  );
}
