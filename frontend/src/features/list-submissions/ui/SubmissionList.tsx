import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon, Pager } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { SUBMISSION_STATUSES, SUBMISSION_SORTS } from '@/entities/submission';
import type {
  Submission,
  SubmissionListParams,
  SubmissionSort,
  SubmissionStatus,
} from '@/entities/submission';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';

// Server-paginated conversation list: status / sort / cross-field search all run
// server-side (the list is masked, so PII is never searched or held in bulk).
const PAGE = 20;

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

// Sender label, in priority order: a name/company field, then an email field, then the
// first non-empty value, then the first field. Values are already masked by the API.
function senderOf(s: Submission): string {
  const entries = Object.entries(s.fieldValues);
  const byKey = (re: RegExp): [string, unknown] | undefined => entries.find(([k]) => re.test(k));
  const picked =
    byKey(/名前|氏名|name|会社|company/i) ??
    byKey(/mail|メール|e-?mail/i) ??
    entries.find(([, v]) => valueText(v) !== '') ??
    entries[0];
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
  const [sort, setSort] = useState<SubmissionSort>('date_desc');
  const [page, setPage] = useState(0);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');

  // Debounce the search box; a new query resets to the first page.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQ(qInput);
      setPage(0);
    }, 300);
    return () => {
      window.clearTimeout(id);
    };
  }, [qInput]);

  const params: SubmissionListParams = {
    limit: PAGE,
    offset: page * PAGE,
    sort,
    ...(status !== 'all' ? { status } : {}),
    ...(q !== '' ? { q } : {}),
  };

  const { submissions, total, statusCounts, isLoading, error, refetch } = useSubmissions(params);
  // Unfiltered grand total (cached) for the "matched / of total" header.
  const grand = useSubmissions({ limit: 1, offset: 0 });
  const grandTotal = grand.total;

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('inbox.unknownForm', { id: String(id) });
  };

  const allCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const currentPage = page < pageCount ? page : pageCount - 1;

  const statusLabel = (key: StatusFilter): string =>
    key === 'all' ? t('inbox.tab.all') : t(`submission.status.${key}`);

  return (
    <div className="ib-list">
      <div className="ib-listhead">
        <div className="ib-htitle">
          <h1>{t('inbox.title')}</h1>
          <span className="c">
            {total !== grandTotal
              ? t('inbox.count.filtered', { filtered: String(total), total: String(grandTotal) })
              : t('inbox.count.total', { total: String(total) })}
          </span>
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
        <div className="ib-controls">
          <label className="ib-ctl">
            <span>{t('inbox.ctl.status')}</span>
            <select
              className="select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(0);
              }}
            >
              <option value="all">{`${statusLabel('all')}（${String(allCount)}）`}</option>
              {SUBMISSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {`${statusLabel(s)}（${String(statusCounts[s] ?? 0)}）`}
                </option>
              ))}
            </select>
          </label>
          <label className="ib-ctl">
            <span>{t('inbox.ctl.sort')}</span>
            <select
              className="select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SubmissionSort);
                setPage(0);
              }}
            >
              {SUBMISSION_SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`inbox.sort.${s}`)}
                </option>
              ))}
            </select>
          </label>
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

      {!isLoading && error === null ? (
        <Pager
          page={currentPage}
          pages={pageCount}
          onPage={(p) => {
            setPage(p);
          }}
        />
      ) : null}
    </div>
  );
}
