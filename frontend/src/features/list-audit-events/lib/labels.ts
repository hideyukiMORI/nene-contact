import type { AuditEvent } from '@/entities/audit-event';
import type { MessageKey } from '@/shared/i18n/messages/ja';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

/** Who performed the change: a user id, or the system/CLI when there is no actor. */
export function actorLabel(event: AuditEvent, t: Translate): string {
  return event.actorUserId !== null
    ? t('audit.actor.user', { id: String(event.actorUserId) })
    : t('audit.actor.system');
}

// Audit actions are `{entity}.{verb}` (terminology §9). We humanize them by composing two
// small dictionaries rather than enumerating every action; an unregistered entity or verb
// falls back to the raw string so a new action never renders blank.
const ENTITY_LABEL_KEYS: Record<string, MessageKey> = {
  submission: 'audit.entity.submission',
  submission_note: 'audit.entity.submission_note',
  submission_technical_meta: 'audit.entity.submission_technical_meta',
  contact_form: 'audit.entity.contact_form',
  notification_channel: 'audit.entity.notification_channel',
  attachment: 'audit.entity.attachment',
  handoff: 'audit.entity.handoff',
  autoreply: 'audit.entity.autoreply',
  user: 'audit.entity.user',
  organization: 'audit.entity.organization',
};

const VERB_LABEL_KEYS: Record<string, MessageKey> = {
  created: 'audit.verb.created',
  updated: 'audit.verb.updated',
  deleted: 'audit.verb.deleted',
  corrected: 'audit.verb.corrected',
  expired: 'audit.verb.expired',
  purged: 'audit.verb.purged',
  viewed: 'audit.verb.viewed',
  exported: 'audit.verb.exported',
  retried: 'audit.verb.retried',
  sent: 'audit.verb.sent',
  suppressed: 'audit.verb.suppressed',
  failed: 'audit.verb.failed',
};

/**
 * Natural-language label for an action string, e.g. `submission_technical_meta.viewed` →
 * 「技術情報を閲覧」/ "Viewed technical info". Falls back to the raw action when the entity or
 * verb is not in the dictionary.
 */
export function actionLabel(action: string, t: Translate): string {
  const dot = action.lastIndexOf('.');
  if (dot === -1) {
    return action;
  }
  const entityKey = ENTITY_LABEL_KEYS[action.slice(0, dot)];
  const verbKey = VERB_LABEL_KEYS[action.slice(dot + 1)];
  if (entityKey === undefined || verbKey === undefined) {
    return action;
  }
  return t('audit.actionFmt', { entity: t(entityKey), verb: t(verbKey) });
}
