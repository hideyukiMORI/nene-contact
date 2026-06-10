import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { SUBMISSION_STATUSES } from '@/entities/submission';
import type { Submission, SubmissionListParams, SubmissionStatus } from '@/entities/submission';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';

// The inbox is a conversation list; we load a generous window and let it scroll
// (the design list pane has no pager). Status + cross-field search run server-side.
const WINDOW = 100;

type StatusFilter = 'all' | SubmissionStatus;

const BADGE_CLASS: Record<SubmissionStatus, string> = {
  open: 'open',
  in_progress: 'prog',
  resolved: 'done',
  spam: 'spam',
};

function valueText(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((x) => valueText(x)).join(', ');
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

// Sender = the name/company field if present, else the first value (already masked by the API).
function senderOf(s: Submission): string {
  const entries = Object.entries(s.fieldValues);
  const named = entries.find(([k]) => /名前|name|会社|company/i.test(k));
  const picked = named ?? entries[0];
  return picked ? valueText(picked[1]) || '—' : '—';
}

// Snippet = the remaining (masked) field values, so the row hints at the content.
function snippetOf(s: Submission, sender: string): string {
  return Object.values(s.fieldValues)
    .map((v) => valueText(v))
    .filter((text) => text !== '' && text !== sender)
    .join(' · ');
}

// Compact the API timestamp ("2026-06-04 13:14:26") to "06-04 13:14".
function shortTime(at: string | null): string {
  if (at === null) return '—';
  return at.length >= 16 ? at.slice(5, 16) : at;
}

export function SubmissionList({ selectedId }: { selectedId: number | null }): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const formsQuery = useContactFormsQuery();
  const forms = formsQuery.data?.items ?? [];

  const [status, setStatus] = useState<StatusFilter>('all');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');

  // Debounce the search box.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQ(qInput);
    }, 300);
    return () => {
      window.clearTimeout(id);
    };
  }, [qInput]);

  const params: SubmissionListParams = {
    limit: WINDOW,
    offset: 0,
    ...(status !== 'all' ? { status } : {}),
    ...(q !== '' ? { q } : {}),
  };

  const { submissions, statusCounts, isLoading, error, refetch } = useSubmissions(params);

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('inbox.unknownForm', { id: String(id) });
  };

  const allCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const openCount = statusCounts.open ?? 0;

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: t('inbox.tab.all'), count: allCount },
    ...SUBMISSION_STATUSES.map((s) => ({
      key: s,
      label: t(`submission.status.${s}`),
      count: statusCounts[s] ?? 0,
    })),
  ];

  return (
    <div className="ib-list">
      <div className="ib-listhead">
        <div className="ib-htitle">
          <h1>{t('inbox.title')}</h1>
          <span className="c">{t('inbox.unhandled', { n: String(openCount) })}</span>
        </div>
        <div className="ib-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder={t('inbox.searchShort')}
            aria-label={t('inbox.search')}
            value={qInput}
            onChange={(e) => {
              setQInput(e.target.value);
            }}
          />
        </div>
        <div className="ib-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={'ib-tab' + (status === tab.key ? ' on' : '')}
              onClick={() => {
                setStatus(tab.key);
              }}
            >
              {tab.label}
              <span className="n">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ib-rows">
        {isLoading ? (
          <div className="ib-rows-state">{t('common.loading')}</div>
        ) : error !== null ? (
          <div className="ib-rows-state">
            <div className="au-note" role="alert">
              {t('inbox.error')}
            </div>
            <button type="button" className="ex-btn ghost" onClick={refetch}>
              {t('common.retry')}
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="ib-rows-state">
            {q !== '' || status !== 'all' ? t('inbox.noMatch') : t('inbox.emptyTitle')}
          </div>
        ) : (
          submissions.map((s) => {
            const sender = senderOf(s);
            const unread = s.status === 'open';
            return (
              <button
                key={s.id}
                type="button"
                className={
                  'ib-row' + (s.id === selectedId ? ' on' : '') + (unread ? ' unread' : '')
                }
                onClick={() => {
                  void navigate(`/submissions/${String(s.id)}`);
                }}
              >
                <div className="r1">
                  {unread ? <span className="dot" /> : null}
                  <span className="nm">{sender}</span>
                  <span className="time">{shortTime(s.submittedAt)}</span>
                </div>
                <div className="r2">
                  <span className="ty">{formName(s.contactFormId)}</span>
                  <span className={`ex-badge ${BADGE_CLASS[s.status]}`}>
                    <span className="dot" />
                    {t(`submission.status.${s.status}`)}
                  </span>
                </div>
                <div className="snip">{snippetOf(s, sender)}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
