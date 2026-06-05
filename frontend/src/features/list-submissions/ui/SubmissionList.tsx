import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { SUBMISSION_STATUSES } from '@/entities/submission';
import type { SubmissionStatus } from '@/entities/submission';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';
import { InboxIcon } from '@/features/list-submissions/ui/icons';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | SubmissionStatus;

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
  const { submissions, isLoading, error, refetch } = useSubmissions();
  const formsQuery = useContactFormsQuery();
  const forms = formsQuery.data?.items ?? [];

  const [status, setStatus] = useState<StatusFilter>('all');
  const [formId, setFormId] = useState<'all' | number>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('inbox.unknownForm', { id: String(id) });
  };

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: submissions.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      spam: 0,
    };
    for (const s of submissions) {
      result[s.status] += 1;
    }
    return result;
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (formId !== 'all' && s.contactFormId !== formId) return false;
      if (q.length > 0) {
        const haystack =
          `${formName(s.contactFormId)} #${String(s.id)} ${s.submittedAt ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    // formName depends on forms; recompute when those change too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, forms, status, formId, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const resetTo = (apply: () => void): void => {
    apply();
    setPage(1);
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

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('inbox.tab.all') },
    ...SUBMISSION_STATUSES.map((s) => ({
      key: s,
      label: t(`submission.status.${s}`),
    })),
  ];

  return (
    <>
      <div className="inbox-filters">
        <div className="segmented">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={status === tab.key ? 'on' : ''}
              onClick={() => {
                resetTo(() => {
                  setStatus(tab.key);
                });
              }}
            >
              {tab.label}
              <span className="seg-count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="filter-right">
          <select
            className="select select-auto"
            value={formId === 'all' ? 'all' : String(formId)}
            onChange={(e) => {
              const value = e.target.value;
              resetTo(() => {
                setFormId(value === 'all' ? 'all' : Number(value));
              });
            }}
          >
            <option value="all">{t('inbox.allForms')}</option>
            {forms.map((form) => (
              <option key={form.id} value={String(form.id)}>
                {form.name}
              </option>
            ))}
          </select>

          <div className="input-affix search-affix">
            <span className="affix-ico">
              <InboxIcon name="search" size={15} />
            </span>
            <input
              className="input"
              placeholder={t('inbox.search')}
              value={query}
              onChange={(e) => {
                resetTo(() => {
                  setQuery(e.target.value);
                });
              }}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="e-ico">
              <InboxIcon name="inbox" size={26} />
            </div>
            <h3>{t('inbox.noMatch')}</h3>
            <p>{t('inbox.noMatchBody')}</p>
          </div>
        </div>
      ) : (
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
              {pageItems.map((submission) => (
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
              disabled={current <= 1}
              onClick={() => {
                setPage(current - 1);
              }}
            >
              <InboxIcon name="chevLeft" size={14} />
              {t('common.prev')}
            </button>
            <span className="hint">
              {t('inbox.page', { page: String(current), pages: String(pageCount) })}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={current >= pageCount}
              onClick={() => {
                setPage(current + 1);
              }}
            >
              {t('common.next')}
              <InboxIcon name="chevRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
