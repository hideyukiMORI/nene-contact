import type { IconName } from '@/shared/ui';
import type { MessageKey } from '@/shared/i18n/messages/ja';

// The closed set of field types (mirrors backend NeneContact\ContactForm\FieldType / the API enum).
export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'honeypot';

// Field type → list icon (spec §05). Covers the palette types plus the non-palette types
// (checkbox / honeypot) that can still appear when editing an existing form.
export const FIELD_TYPE_ICON: Record<string, IconName> = {
  text: 'text',
  email: 'mail',
  phone: 'phone',
  select: 'list',
  textarea: 'lines',
  date: 'calendar',
  file: 'file',
  checkbox: 'check',
  honeypot: 'lock',
};

// Field type → its display-name message key. Exhaustive over FieldType, and each value is a real
// MessageKey, so adding a type without a label (or naming a non-existent key) is a compile error —
// replacing the old `t(\`builder.type.${x}\` as MessageKey)` casts that silently allowed gaps (#309).
export const FIELD_TYPE_LABEL_KEY: Record<FieldType, MessageKey> = {
  text: 'builder.type.text',
  email: 'builder.type.email',
  phone: 'builder.type.phone',
  textarea: 'builder.type.textarea',
  select: 'builder.type.select',
  checkbox: 'builder.type.checkbox',
  date: 'builder.type.date',
  file: 'builder.type.file',
  honeypot: 'builder.type.honeypot',
};

// Safe lookup for a (string) field type — the type-name label, falling back to the text label for
// an unknown type so the UI never renders an empty type name.
export function fieldTypeLabelKey(type: string): MessageKey {
  return type in FIELD_TYPE_LABEL_KEY
    ? FIELD_TYPE_LABEL_KEY[type as FieldType]
    : FIELD_TYPE_LABEL_KEY.text;
}

// The palette, in the spec's order (総合実装指示書 §03 / field-config core PALETTE).
export const PALETTE: readonly string[] = [
  'text',
  'email',
  'phone',
  'textarea',
  'date',
  'file',
  'select',
];

// Default label + placeholder i18n keys applied when a palette item is added (spec §05), so a
// new field is immediately previewable on the canvas.
export const FIELD_DEFAULT_KEYS: Record<string, { label: MessageKey; placeholder: MessageKey }> = {
  text: { label: 'builder.default.text.label', placeholder: 'builder.default.text.ph' },
  email: { label: 'builder.default.email.label', placeholder: 'builder.default.email.ph' },
  phone: { label: 'builder.default.phone.label', placeholder: 'builder.default.phone.ph' },
  select: { label: 'builder.default.select.label', placeholder: 'builder.default.select.ph' },
  textarea: { label: 'builder.default.textarea.label', placeholder: 'builder.default.textarea.ph' },
  date: { label: 'builder.default.date.label', placeholder: 'builder.default.date.ph' },
  file: { label: 'builder.default.file.label', placeholder: 'builder.default.file.ph' },
};

// The purpose banner copy shown at the top of each field-config panel (field-config UI §00).
export const FIELD_PURPOSE_KEY: Record<string, MessageKey> = {
  text: 'fc.purpose.text',
  email: 'fc.purpose.email',
  phone: 'fc.purpose.phone',
  textarea: 'fc.purpose.textarea',
  date: 'fc.purpose.date',
  file: 'fc.purpose.file',
  select: 'fc.purpose.select',
};
