import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Alert, Button } from '@/shared/ui';
import { useContactFormsQuery } from '@/entities/contact-form';
import { SUBMISSION_STATUSES } from '@/entities/submission';
import type { Submission, SubmissionListParams, SubmissionStatus } from '@/entities/submission';
import { useSubmissions } from '@/features/list-submissions/hooks/use-submissions';
import { InboxIcon } from '@/features/list-submissions/ui/icons';
import { DateRangePicker } from '@/features/list-submissions/ui/DateRangePicker';
import type { RangeKey } from '@/features/list-submissions/ui/DateRangePicker';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | SubmissionStatus;

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (d: Date): string =>
  `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Translate a preset / custom range into concrete from/to dates for the server filter.
function rangeToDates(range: RangeKey, from: string, to: string): { from?: string; to?: string } {
  if (range === 'all') return {};
  if (range === 'custom') {
    const custom: { from?: string; to?: string } = {};
    if (from !== '') custom.from = from;
    if (to !== '') custom.to = to;
    return custom;
  }
  const now = new Date();
  if (range === 'month') {
    return {
      from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (range === 'lastMonth') {
    return {
      from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { from: ymd(start), to: ymd(now) };
}

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
  const formsQuery = useContactFormsQuery();
  const forms = formsQuery.data?.items ?? [];

  const [status, setStatus] = useState<StatusFilter>('all');
  const [formId, setFormId] = useState<'all' | number>('all');
  const [range, setRange] = useState<RangeKey>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search box, and reset to the first page when the query changes.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => {
      window.clearTimeout(id);
    };
  }, [qInput]);

  const dates = rangeToDates(range, from, to);
  const params: SubmissionListParams = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    ...(status !== 'all' ? { status } : {}),
    ...(formId !== 'all' ? { contactFormId: formId } : {}),
    ...(dates.from !== undefined ? { from: dates.from } : {}),
    ...(dates.to !== undefined ? { to: dates.to } : {}),
    ...(q !== '' ? { q } : {}),
  };

  const { submissions, total, statusCounts, isLoading, error, refetch } = useSubmissions(params);

  const formName = (id: number): string => {
    const match = forms.find((f) => f.id === id);
    return match?.name ?? t('inbox.unknownForm', { id: String(id) });
  };

  const hasFilters = status !== 'all' || formId !== 'all' || range !== 'all' || q !== '';
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

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

  // Nothing has ever arrived (no active filter, empty result).
  if (total === 0 && !hasFilters) {
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

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: t('inbox.tab.all'), count: allCount },
    ...SUBMISSION_STATUSES.map((s) => ({
      key: s,
      label: t(`submission.status.${s}`),
      count: statusCounts[s] ?? 0,
    })),
  ];

  const md = (s: string): string => (s.length > 0 ? s.slice(5).replace('-', '/') : '');
  const rangeLabelKey: Record<Exclude<RangeKey, 'all' | 'custom'>, MessageKey> = {
    today: 'inbox.dp.today',
    '7d': 'inbox.dp.last7',
    '30d': 'inbox.dp.last30',
    month: 'inbox.dp.thisMonth',
    lastMonth: 'inbox.dp.lastMonth',
  };
  const rangeChipLabel =
    range === 'custom'
      ? from === to
        ? md(from)
        : `${md(from)} – ${md(to)}`
      : range !== 'all'
        ? t(rangeLabelKey[range])
        : '';

  const clearAll = (): void => {
    setStatus('all');
    setFormId('all');
    setRange('all');
    setFrom('');
    setTo('');
    setQInput('');
    setQ('');
    setPage(1);
  };

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (q !== '') {
    chips.push({
      key: 'q',
      label: t('inbox.chip.search', { q }),
      clear: () => {
        setQInput('');
        setQ('');
        setPage(1);
      },
    });
  }
  if (formId !== 'all') {
    chips.push({
      key: 'form',
      label: formName(formId),
      clear: () => {
        setFormId('all');
        setPage(1);
      },
    });
  }
  if (range !== 'all') {
    chips.push({
      key: 'range',
      label: rangeChipLabel,
      clear: () => {
        setRange('all');
        setFrom('');
        setTo('');
        setPage(1);
      },
    });
  }

  const countLabel =
    total === allCount
      ? t('inbox.count.total', { total: String(allCount) })
      : t('inbox.count.filtered', { filtered: String(total), total: String(allCount) });

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
                setStatus(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
              <span className="seg-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <span className="hint filter-count">{countLabel}</span>
      </div>

      <div className="inbox-search-row">
        <div className="input-affix search-affix">
          <span className="affix-ico">
            <InboxIcon name="search" size={16} />
          </span>
          <input
            className="input"
            placeholder={t('inbox.search')}
            value={qInput}
            onChange={(e) => {
              setQInput(e.target.value);
            }}
          />
          {qInput !== '' ? (
            <button
              type="button"
              className="affix-btn"
              onClick={() => {
                setQInput('');
              }}
            >
              {t('inbox.clear')}
            </button>
          ) : null}
        </div>

        <select
          className="select select-auto"
          value={formId === 'all' ? 'all' : String(formId)}
          onChange={(e) => {
            const value = e.target.value;
            setFormId(value === 'all' ? 'all' : Number(value));
            setPage(1);
          }}
        >
          <option value="all">{t('inbox.allForms')}</option>
          {forms.map((form) => (
            <option key={form.id} value={String(form.id)}>
              {form.name}
            </option>
          ))}
        </select>

        <DateRangePicker
          range={range}
          from={from}
          to={to}
          onChange={({ range: r, from: f, to: nextTo }) => {
            setRange(r);
            setFrom(f);
            setTo(nextTo);
            setPage(1);
          }}
        />
      </div>

      {chips.length > 0 ? (
        <div className="inbox-chips">
          {chips.map((c) => (
            <button key={c.key} type="button" className="chip chip-clear" onClick={c.clear}>
              {c.label}
              <InboxIcon name="x" size={12} />
            </button>
          ))}
          <button type="button" className="link-btn" onClick={clearAll}>
            {t('inbox.clearAll')}
          </button>
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="e-ico">
              <InboxIcon name="inbox" size={26} />
            </div>
            <h3>{t('inbox.noMatch')}</h3>
            <p>{t('inbox.noMatchBody')}</p>
            <button type="button" className="btn btn-sm" onClick={clearAll}>
              {t('inbox.clearFilters')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('inbox.column.form')}</th>
                <th>{t('inbox.column.from')}</th>
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
                  <td className="sender-cell">{senderOf(submission)}</td>
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
                setPage(page - 1);
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
                setPage(page + 1);
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
