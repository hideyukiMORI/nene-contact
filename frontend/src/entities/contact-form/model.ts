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
  // Stable id that ChoiceConfig.defaults reference (persisted as the option `value`).
  value: string;
  label: Record<string, string>;
  // Optional per-option supplementary note + attached image (picture choice, builder spec v2.0).
  description?: Record<string, string>;
  image?: boolean;
}

// Choice (select) display styles — the style internalizes the selection logic.
// Mirrors backend NeneContact\ContactForm\ChoiceStyle (builder spec v2.0).
export type ChoiceStyleId = 'radio' | 'dropdown' | 'segment' | 'checkbox' | 'tags' | 'chips';
export type ChoiceCardLayout = 'card' | 'list';
export type ChoiceRatio = '1:1' | '4:3' | '16:9';

export interface ChoiceOtherConfig {
  label: string;
  placeholder: string;
  required: boolean;
  // 0 = unlimited.
  maxLen: number;
}

export interface ChoiceCountRule {
  minOn: boolean;
  min: number;
  maxOn: boolean;
  max: number;
}

export interface ChoiceImageConfig {
  enabled: boolean;
  layout: ChoiceCardLayout;
  cols: 2 | 3;
  ratio: ChoiceRatio;
}

// Declarative display config for a choice (select) field (builder spec v2.0).
export interface ChoiceConfig {
  style: ChoiceStyleId;
  // Initially-selected option values; single-logic styles keep at most one.
  defaults: string[];
  other: boolean;
  otherConfig: ChoiceOtherConfig;
  countRule: ChoiceCountRule;
  image: ChoiceImageConfig;
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
  // Present for select fields (builder spec v2.0); null/undefined otherwise.
  choice?: ChoiceConfig | null;
}

export interface ContactFormDraft {
  name: string;
  description: string;
  // Custom public slug; settable at create (empty = auto-generate), immutable after.
  publicFormKey: string;
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
