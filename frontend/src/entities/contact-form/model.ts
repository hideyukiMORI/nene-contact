import type { SupportedLocale } from '@/shared/i18n/locales';

export interface ContactForm {
  id: number;
  name: string;
  publicFormKey: string;
  defaultLocale: string;
  locales: string[];
  status: string;
  consentRequired: boolean;
}

export interface ContactFormList {
  items: ContactForm[];
  total: number;
}

export interface DraftFieldOption {
  value: string;
  label: Record<string, string>;
}

export interface DraftField {
  // Client-only stable id for drag-to-reorder; not sent to the API.
  id: string;
  fieldType: string;
  name: string;
  label: Record<string, string>;
  required: boolean;
  options: DraftFieldOption[] | null;
}

export interface ContactFormDraft {
  name: string;
  defaultLocale: SupportedLocale;
  locales: SupportedLocale[];
  allowedOrigins: string[];
  consentRequired: boolean;
  consentLabel: Record<string, string> | null;
  retentionDays: number | null;
  fields: DraftField[];
}
