import type { IconName } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';

// Field type → list icon (spec §05). Covers the palette types plus the non-palette types
// (checkbox / honeypot) that can still appear when editing an existing form.
export const FIELD_TYPE_ICON: Record<string, IconName> = {
  text: 'text',
  email: 'mail',
  select: 'list',
  textarea: 'lines',
  date: 'calendar',
  file: 'file',
  checkbox: 'check',
  honeypot: 'lock',
};

// The palette, in the spec's order (§04③ / §05).
export const PALETTE: readonly string[] = ['text', 'email', 'select', 'textarea', 'date', 'file'];

// Default label + placeholder i18n keys applied when a palette item is added (spec §05), so a
// new field is immediately previewable on the canvas.
export const FIELD_DEFAULT_KEYS: Record<string, { label: MessageKey; placeholder: MessageKey }> = {
  text: { label: 'builder.default.text.label', placeholder: 'builder.default.text.ph' },
  email: { label: 'builder.default.email.label', placeholder: 'builder.default.email.ph' },
  select: { label: 'builder.default.select.label', placeholder: 'builder.default.select.ph' },
  textarea: { label: 'builder.default.textarea.label', placeholder: 'builder.default.textarea.ph' },
  date: { label: 'builder.default.date.label', placeholder: 'builder.default.date.ph' },
  file: { label: 'builder.default.file.label', placeholder: 'builder.default.file.ph' },
};
