import type { ReactNode } from 'react';
import type { AuditEvent } from '@/entities/audit-event';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { actorLabel } from '@/features/list-audit-events/lib/labels';
import { diffRows } from '@/features/list-audit-events/lib/format';

export function AuditLogDetail({ event }: { event: AuditEvent }): ReactNode {
  const { t } = useI18n();
  const rows = diffRows(event);
  const isCreate = event.before === null;
  const isDelete = event.after === null;

  return (
    <div className="ib-detail">
      <div className="ib-dhead">
        <span className="ib-av">
          <Icon name="shield" size={18} />
        </span>
        <div className="ib-who">
          <div className="nm al-action">{event.action}</div>
          <div className="sub">
            {event.entityType}
            {event.entityId !== null ? ` #${String(event.entityId)}` : ''}
          </div>
        </div>
      </div>

      <div className="ib-dbody">
        <dl className="ib-meta">
          <dt>{t('audit.field.actor')}</dt>
          <dd>{actorLabel(event, t)}</dd>
          <dt>{t('audit.field.entity')}</dt>
          <dd>
            {event.entityType}
            {event.entityId !== null ? ` #${String(event.entityId)}` : ''}
          </dd>
          <dt>{t('audit.field.at')}</dt>
          <dd>{event.createdAt ?? '—'}</dd>
        </dl>

        <div className="ib-msg-lab">
          {isCreate ? t('audit.created') : isDelete ? t('audit.deleted') : t('audit.changed')}
        </div>
        {rows.length === 0 ? (
          <div className="al-nodiff">{t('audit.noDiff')}</div>
        ) : (
          <ul className="al-diff">
            {rows.map((row) => (
              <li key={row.key} className={`al-drow ${row.kind}`}>
                <span className="al-dkey">{row.key}</span>
                <span className="al-dval">
                  {row.kind === 'added' ? (
                    <span className="al-after">{row.after}</span>
                  ) : row.kind === 'removed' ? (
                    <span className="al-before">{row.before}</span>
                  ) : (
                    <>
                      <span className="al-before">{row.before}</span>
                      <Icon name="chevRight" size={13} />
                      <span className="al-after">{row.after}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
