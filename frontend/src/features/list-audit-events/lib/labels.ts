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
//
// 🔴 These two dictionaries must cover every entity/verb registered in terminology §9. Three
// separate features shipped an action without adding it here (tags, service tokens, the audit
// export), and the fallback made the omission look like a design choice on screen instead of a
// bug. `labels.test.ts` now asserts the coverage — extend the lists there when §9 grows.
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
  service_token: 'audit.entity.service_token',
  tag: 'audit.entity.tag',
  audit_event: 'audit.entity.audit_event',
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
  issued: 'audit.verb.issued',
  revoked: 'audit.verb.revoked',
  tested: 'audit.verb.tested',
  tagged: 'audit.verb.tagged',
  untagged: 'audit.verb.untagged',
  password_changed: 'audit.verb.password_changed',
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
