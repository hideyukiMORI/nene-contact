import type { AuditEvent } from '@/entities/audit-event';
import type { MessageKey } from '@/shared/i18n/messages/ja';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

/** Who performed the change: a user id, or the system/CLI when there is no actor. */
export function actorLabel(event: AuditEvent, t: Translate): string {
  return event.actorUserId !== null
    ? t('audit.actor.user', { id: String(event.actorUserId) })
    : t('audit.actor.system');
}
