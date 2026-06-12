import type { FieldTypeConfig } from '@/entities/contact-form/model';

// Default per-type config applied when a field is created or when an existing row predates the
// field-config UI. Mirrors the backend FieldTypeConfig defaults. Returns null for types that
// carry no config (checkbox / honeypot / select — select uses defaultChoiceConfig instead).
export function defaultFieldTypeConfig(type: string): FieldTypeConfig | null {
  switch (type) {
    case 'text':
      return { format: 'none', minOn: false, min: 1, maxOn: false, max: 100, counter: false };
    case 'email':
      return { confirm: false, domainMode: 'none', domains: '', autoreply: false };
    case 'phone':
      return { format: 'jp' };
    case 'textarea':
      return { rows: 'md', minOn: false, min: 1, maxOn: false, max: 500, counter: false };
    case 'date':
      return { mode: 'date', range: 'none', from: '', to: '', def: 'none' };
    case 'file':
      return {
        fmtImage: true,
        fmtPdf: true,
        fmtDoc: false,
        maxSize: 10,
        multiple: false,
        maxCount: 3,
      };
    default:
      return null;
  }
}
