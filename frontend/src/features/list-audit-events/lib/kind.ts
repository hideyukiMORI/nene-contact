import type { MessageKey } from '@/shared/i18n/messages/ja';

export type AuditKind = 'created' | 'updated' | 'deleted' | 'read';

/** Classify an event by its action suffix (e.g. contact_form.updated → updated). */
export function kindOf(action: string): AuditKind {
  if (action.endsWith('.created')) return 'created';
  if (action.endsWith('.updated')) return 'updated';
  if (action.endsWith('.deleted')) return 'deleted';
  return 'read';
}

/** i18n key for the kind badge label. */
export function kindLabelKey(kind: AuditKind): MessageKey {
  return `audit.kind.${kind}`;
}

/** i18n key for the "what changed" section heading, which reads differently per kind. */
export function diffLabelKey(kind: AuditKind): MessageKey {
  return `audit.difflab.${kind}`;
}
