import type { ReactNode } from 'react';
import type { AuditEvent } from '@/entities/audit-event';
import { useI18n } from '@/shared/i18n';
import { Icon, Pager } from '@/shared/ui';
import { actionLabel, actorLabel } from '@/features/list-audit-events/lib/labels';
import {
  AUDIT_PERIODS,
  type AuditPeriod,
} from '@/features/list-audit-events/model/use-audit-events';

const TODAY = new Date().toISOString().slice(0, 10);

function shortTime(value: string | null): string {
  if (value === null) {
    return '';
  }
  // "YYYY-MM-DD HH:MM:SS" → "MM-DD HH:MM" (chars 5..15).
  return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(value) ? value.slice(5, 16) : value;
}

export interface AuditLogListProps {
  events: AuditEvent[];
  total: number;
  matched: number;
  page: number;
  pageCount: number;
  isLoading: boolean;
  error: boolean;
  q: string;
  period: AuditPeriod;
  from: string;
  to: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onSearch: (q: string) => void;
  onPeriod: (p: AuditPeriod) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onPage: (page: number) => void;
  onRetry: () => void;
}

export function AuditLogList(props: AuditLogListProps): ReactNode {
  const { t } = useI18n();
  const {
    events,
    total,
    matched,
    page,
    pageCount,
    isLoading,
    error,
    q,
    period,
    from,
    to,
    selectedId,
  } = props;

  return (
    <div className="ib-list">
      <div className="ib-listhead">
        <div className="ib-htitle">
          <h1>{t('audit.title')}</h1>
          <span className="c">
            {matched !== total
              ? t('audit.countOf', { n: String(matched), total: String(total) })
              : t('audit.count', { n: String(total) })}
          </span>
        </div>
        <p className="al-lead">{t('audit.lead')}</p>
        <div className="ib-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder={t('audit.search')}
            aria-label={t('audit.search')}
            value={q}
            onChange={(e) => {
              props.onSearch(e.target.value);
            }}
          />
        </div>
        <div className="al-period">
          <div className="seg">
            {AUDIT_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                className={period === p ? 'on' : ''}
                onClick={() => {
                  props.onPeriod(p);
                }}
              >
                {t(`audit.period.${p}`)}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' ? (
          <div className="al-range">
            <input
              type="date"
              value={from}
              max={to || TODAY}
              aria-label={t('audit.from')}
              onChange={(e) => {
                props.onFrom(e.target.value);
              }}
            />
            <span className="to">〜</span>
            <input
              type="date"
              value={to}
              min={from}
              max={TODAY}
              aria-label={t('audit.to')}
              onChange={(e) => {
                props.onTo(e.target.value);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="ib-rows">
        {isLoading ? (
          <div className="ib-rows-state">{t('common.loading')}</div>
        ) : error ? (
          <div className="ib-rows-state">
            <div className="au-note" role="alert">
              {t('audit.error')}
            </div>
            <button type="button" className="ex-btn ghost" onClick={props.onRetry}>
              {t('common.retry')}
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="ib-rows-state">{t('audit.empty')}</div>
        ) : (
          events.map((e) => (
            <button
              key={e.id}
              type="button"
              className={'ib-row' + (e.id === selectedId ? ' on' : '')}
              onClick={() => {
                props.onSelect(e.id);
              }}
            >
              <div className="r1">
                <span className="nm">{actionLabel(e.action, t)}</span>
                <span className="time">{shortTime(e.createdAt)}</span>
              </div>
              <div className="snip">
                {actorLabel(e, t)} ・ {e.entityType}
                {e.entityId !== null ? ` #${String(e.entityId)}` : ''}
              </div>
            </button>
          ))
        )}
      </div>

      {!isLoading && !error ? <Pager page={page} pages={pageCount} onPage={props.onPage} /> : null}
    </div>
  );
}
