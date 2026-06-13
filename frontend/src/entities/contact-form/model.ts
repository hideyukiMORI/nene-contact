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

// Embed appearance (Appearance Studio — appearance v2). Nested token tree mirroring backend
// NeneContact\ContactForm\Appearance and the studio model (window.STUDIO.DEFAULT).
export type AppearanceMode = 'modal' | 'chat' | 'inline';
export type AppearanceTheme = 'light' | 'dark';
export type AppearanceFont = 'system' | 'sans' | 'serif';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type FocusShape = 'ring' | 'solid' | 'glow';
export type MotionAnim = 'fade' | 'slide' | 'scale';
export type Density = 'compact' | 'cozy' | 'comfortable';
export type ButtonStyle = 'solid' | 'outline' | 'soft';
export type ModalPosition = 'center' | 'right';
export type LauncherSide = 'left' | 'right';
export type LauncherShape = 'pill' | 'circle';
export type InlineAlign = 'left' | 'center' | 'right';
export type HeroFit = 'cover' | 'contain';

export interface AppearanceColors {
  accent: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  inputBg: string;
  error: string;
  buttonText: string;
}

export interface Appearance {
  mode: AppearanceMode;
  preset: string;
  theme: AppearanceTheme;
  font: AppearanceFont;
  fontH: AppearanceFont;
  colors: AppearanceColors;
  radius: { form: number; input: number; button: number };
  border: { width: number; style: BorderStyle; color: string };
  focus: { color: string; width: number; shape: FocusShape };
  motion: { anim: MotionAnim; speed: number };
  density: Density;
  button: { style: ButtonStyle; pill: boolean };
  modal: { width: number; position: ModalPosition; backdrop: number };
  chat: { oneByOne: boolean; progress: boolean; typing: boolean };
  launcher: { side: LauncherSide; shape: LauncherShape; label: string };
  inline: { align: InlineAlign };
  hero: {
    on: boolean;
    media: string;
    fit: HeroFit;
    height: number;
    inset: number;
    overlay: number;
    overlayTitle: boolean;
  };
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

// Per-type declarative config for non-choice fields (field-config UI, builder spec v1.0).
// Mirrors backend NeneContact\ContactForm\FieldTypeConfig. checkbox/honeypot carry no config.
export type TextFormat = 'none' | 'kana' | 'alnum';
export type PhoneFormat = 'jp' | 'jp-nohyphen' | 'intl';
export type DomainMode = 'none' | 'allow' | 'block';
export type TextareaRows = 'sm' | 'md' | 'lg';
export type DateMode = 'date' | 'datetime' | 'time';
export type DateRange = 'none' | 'future' | 'past' | 'between';
export type DateDefault = 'none' | 'today';
export type FileMaxSize = 5 | 10 | 25;

export interface CharLimit {
  minOn: boolean;
  min: number;
  maxOn: boolean;
  max: number;
  counter: boolean;
}

export interface TextConfig extends CharLimit {
  format: TextFormat;
}
export interface EmailConfig {
  confirm: boolean;
  domainMode: DomainMode;
  domains: string;
  autoreply: boolean;
}
export interface PhoneConfig {
  format: PhoneFormat;
}
export interface TextareaConfig extends CharLimit {
  rows: TextareaRows;
}
export interface DateConfig {
  mode: DateMode;
  range: DateRange;
  from: string;
  to: string;
  def: DateDefault;
}
export interface FileConfig {
  fmtImage: boolean;
  fmtPdf: boolean;
  fmtDoc: boolean;
  maxSize: FileMaxSize;
  multiple: boolean;
  maxCount: number;
}

export type FieldTypeConfig =
  | TextConfig
  | EmailConfig
  | PhoneConfig
  | TextareaConfig
  | DateConfig
  | FileConfig;

export interface DraftField {
  // Client-only stable id for drag-to-reorder; not sent to the API.
  id: string;
  fieldType: string;
  name: string;
  label: Record<string, string>;
  // Optional per-field description shown under the label (field-config UI).
  description: string;
  placeholder: string;
  required: boolean;
  options: DraftFieldOption[] | null;
  // Present for select fields (builder spec v2.0); null/undefined otherwise.
  choice?: ChoiceConfig | null;
  // Per-type config for non-choice fields; null for checkbox/honeypot.
  typeConfig?: FieldTypeConfig | null;
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
  appearance: Appearance;
  // Submit experience (builder フォーム設定): button label + after-submit behaviour.
  submitLabel: Record<string, string> | null;
  postSubmit: PostSubmitAction;
  successMessage: Record<string, string> | null;
  redirectUrl: string | null;
  fields: DraftField[];
}

// After a successful submit: show a completion message (default) or redirect away.
export type PostSubmitAction = 'message' | 'redirect';

// A full form: the editable draft plus the server-owned identity. Used by the read-only
// detail view and as the builder's edit seed (a draft is a structural subset).
export interface ContactFormDetail extends ContactFormDraft {
  id: number;
  publicFormKey: string;
  status: string;
}
