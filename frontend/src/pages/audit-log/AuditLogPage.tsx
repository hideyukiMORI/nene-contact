import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { AuditLogList, AuditLogDetail, useAuditEvents } from '@/features/list-audit-events';

// The audit log is the same two-pane as the inbox: an event list on the left and the
// selected event's before/after on the right. The list already carries the full
// before/after snapshots, so selecting a row is local state — no second fetch.
export function AuditLogPage(): ReactNode {
  const { t } = useI18n();
  const audit = useAuditEvents();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = audit.events.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="ib-wrap" data-detail={selected !== null ? 'open' : 'closed'}>
      <AuditLogList
        events={audit.events}
        total={audit.total}
        matched={audit.matched}
        page={audit.page}
        pageCount={audit.pageCount}
        isLoading={audit.isLoading}
        error={audit.error !== null}
        q={audit.q}
        period={audit.period}
        from={audit.from}
        to={audit.to}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onSearch={audit.setQ}
        onPeriod={audit.setPeriod}
        onFrom={audit.setFrom}
        onTo={audit.setTo}
        onPage={audit.setPage}
        onRetry={audit.refetch}
      />
      {selected !== null ? (
        <AuditLogDetail event={selected} />
      ) : (
        <div className="ib-nodetail">
          <div className="ic">
            <Icon name="shield" size={30} />
            {t('audit.selectHint')}
          </div>
        </div>
      )}
    </div>
  );
}
