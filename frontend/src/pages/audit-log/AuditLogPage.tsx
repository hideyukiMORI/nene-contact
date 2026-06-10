import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { AuditLogList, AuditLogDetail, useAuditEvents } from '@/features/list-audit-events';

// The audit log is the same two-pane as the inbox: an event list on the left and the
// selected event's before/after detail on the right. The list already carries the full
// before/after snapshots, so selecting a row is local state — no second fetch.
export function AuditLogPage(): ReactNode {
  const { t } = useI18n();
  const { events, total, page, pageCount, setPage, isLoading, error, refetch } = useAuditEvents();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="ib-wrap" data-detail={selected !== null ? 'open' : 'closed'}>
      <AuditLogList
        events={events}
        total={total}
        page={page}
        pageCount={pageCount}
        isLoading={isLoading}
        error={error !== null}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onPrev={() => {
          setSelectedId(null);
          setPage(Math.max(0, page - 1));
        }}
        onNext={() => {
          setSelectedId(null);
          setPage(page + 1);
        }}
        onRetry={refetch}
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
