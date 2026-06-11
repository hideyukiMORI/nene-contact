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
  placeholder: string;
  required: boolean;
  options: DraftFieldOption[] | null;
}

export interface ContactFormDraft {
  name: string;
  description: string;
  defaultLocale: SupportedLocale;
  locales: SupportedLocale[];
  allowedOrigins: string[];
  consentRequired: boolean;
  consentLabel: Record<string, string> | null;
  retentionDays: number | null;
  fields: DraftField[];
}

// A full form: the editable draft plus the server-owned identity. Used by the read-only
// detail view and as the builder's edit seed (a draft is a structural subset).
export interface ContactFormDetail extends ContactFormDraft {
  id: number;
  publicFormKey: string;
  status: string;
}
