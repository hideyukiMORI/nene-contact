import type { ReactNode } from 'react';
import type { AuditEvent } from '@/entities/audit-event';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { actorLabel } from '@/features/list-audit-events/lib/labels';

function shortTime(value: string | null): string {
  if (value === null) {
    return '';
  }
  // Stored as "YYYY-MM-DD HH:MM:SS"; show "MM-DD HH:MM" (chars 5..15).
  return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(value) ? value.slice(5, 16) : value;
}

export function AuditLogList({
  events,
  total,
  page,
  pageCount,
  isLoading,
  error,
  selectedId,
  onSelect,
  onPrev,
  onNext,
  onRetry,
}: {
  events: AuditEvent[];
  total: number;
  page: number;
  pageCount: number;
  isLoading: boolean;
  error: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onRetry: () => void;
}): ReactNode {
  const { t } = useI18n();

  return (
    <div className="ib-list">
      <div className="ib-listhead">
        <div className="ib-htitle">
          <h1>{t('audit.title')}</h1>
          <span className="c">{t('audit.count', { n: String(total) })}</span>
        </div>
        <p className="al-lead">{t('audit.lead')}</p>
      </div>

      <div className="ib-rows">
        {isLoading ? (
          <div className="ib-rows-state">{t('common.loading')}</div>
        ) : error ? (
          <div className="ib-rows-state">
            <div className="au-note" role="alert">
              {t('audit.error')}
            </div>
            <button type="button" className="ex-btn ghost" onClick={onRetry}>
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
                onSelect(e.id);
              }}
            >
              <div className="r1">
                <span className="nm al-action">{e.action}</span>
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

      {!isLoading && !error && pageCount > 1 ? (
        <div className="al-pager">
          <button type="button" className="ex-btn ghost" disabled={page === 0} onClick={onPrev}>
            <Icon name="chevLeft" size={14} />
            {t('common.prev')}
          </button>
          <span className="al-pageinfo">
            {t('audit.page', { page: String(page + 1), pages: String(pageCount) })}
          </span>
          <button
            type="button"
            className="ex-btn ghost"
            disabled={page + 1 >= pageCount}
            onClick={onNext}
          >
            {t('common.next')}
            <Icon name="chevRight" size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
