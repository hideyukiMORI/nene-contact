import { describe, expect, it } from 'vitest';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { ja } from '@/shared/i18n/messages/ja';
import { actionLabel } from '@/features/list-audit-events/lib/labels';

// Translate against the real ja catalog so the composed string is exercised end to end.
function t(key: MessageKey, params?: Record<string, string>): string {
  const template = ja[key];
  return params === undefined
    ? template
    : template.replace(/\{(\w+)\}/g, (m, name: string) => params[name] ?? m);
}

describe('actionLabel', () => {
  it('composes entity + verb into natural language (ja)', () => {
    expect(actionLabel('submission_technical_meta.viewed', t)).toBe('技術情報を閲覧');
    expect(actionLabel('contact_form.updated', t)).toBe('問い合わせフォームを更新');
    expect(actionLabel('handoff.retried', t)).toBe('連携を再試行');
  });

  it('falls back to the raw action for an unknown entity or verb', () => {
    expect(actionLabel('mystery.updated', t)).toBe('mystery.updated');
    expect(actionLabel('submission.teleported', t)).toBe('submission.teleported');
    expect(actionLabel('no-dot', t)).toBe('no-dot');
  });

  // #533: three features (tags, service tokens, the audit export) shipped an action the
  // dictionaries did not know, and the raw-string fallback made the omission look deliberate
  // on screen. Every action registered in terminology §9 must humanize.
  const REGISTERED_ACTIONS = [
    'submission.created',
    'submission.updated',
    'submission.deleted',
    'submission.corrected',
    'submission.expired',
    'submission.purged',
    'submission.viewed',
    'submission.exported',
    'submission.tagged',
    'submission.untagged',
    'submission_note.created',
    'submission_technical_meta.viewed',
    'contact_form.created',
    'contact_form.updated',
    'contact_form.deleted',
    'notification_channel.created',
    'notification_channel.updated',
    'notification_channel.deleted',
    'notification_channel.tested',
    'attachment.purged',
    'handoff.created',
    'handoff.retried',
    'autoreply.sent',
    'autoreply.suppressed',
    'autoreply.failed',
    'user.created',
    'user.updated',
    'user.password_changed',
    'organization.created',
    'service_token.issued',
    'service_token.revoked',
    'tag.created',
    'tag.updated',
    'tag.deleted',
    'audit_event.exported',
  ];

  it.each(REGISTERED_ACTIONS)('humanizes %s instead of showing the raw identifier', (action) => {
    expect(actionLabel(action, t)).not.toBe(action);
  });
});
