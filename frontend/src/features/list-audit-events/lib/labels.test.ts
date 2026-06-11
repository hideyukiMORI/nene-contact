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
});
