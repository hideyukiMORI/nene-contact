import type {
  ContactFormDto,
  ContactFormListDto,
  CreateContactFormDto,
} from '@/entities/contact-form/api-types';
import { defaultFieldTypeConfig } from '@/entities/contact-form/field-defaults';
import type {
  Appearance,
  ChoiceCardLayout,
  ChoiceConfig,
  ChoiceRatio,
  ChoiceStyleId,
  ContactForm,
  ContactFormDetail,
  ContactFormDraft,
  ContactFormList,
  DraftField,
  DraftFieldOption,
  FieldTypeConfig,
} from '@/entities/contact-form/model';

// The studio default token tree (current NeNe look); mirrors backend
// NeneContact\ContactForm\Appearance::defaultData() and window.STUDIO.DEFAULT.
export function defaultAppearance(): Appearance {
  return {
    mode: 'modal',
    preset: 'nene',
    theme: 'light',
    font: 'sans',
    fontH: 'sans',
    colors: {
      accent: '#dc5b34',
      surface: '#ffffff',
      text: '#161a22',
      muted: '#5a6273',
      border: '#e2e6eb',
      inputBg: '#ffffff',
      error: '#d14343',
      buttonText: '#ffffff',
    },
    radius: { form: 14, input: 8, button: 8 },
    border: { width: 1.5, style: 'solid', color: '#e2e6eb' },
    focus: { color: '#dc5b34', width: 3.5, shape: 'ring' },
    motion: { anim: 'scale', speed: 320 },
    density: 'cozy',
    button: { style: 'solid', pill: false },
    modal: { width: 460, position: 'center', backdrop: 0.45 },
    chat: { oneByOne: true, progress: true, typing: true },
    launcher: { side: 'right', shape: 'pill', label: 'お問い合わせ' },
    inline: { align: 'center' },
    hero: {
      on: true,
      media: 'm-team',
      fit: 'cover',
      height: 150,
      inset: 0,
      overlay: 0.28,
      overlayTitle: true,
    },
  };
}

// The backend validates and always returns a complete tree; this is a defensive deep-merge so a
// partial/legacy payload still resolves to a full Appearance. Scalars/objects merge per group.
function toAppearance(raw: unknown): Appearance {
  const d = defaultAppearance();
  if (typeof raw !== 'object' || raw === null) {
    return d;
  }
  const a = raw as Record<string, unknown>;
  const group = <T>(key: string, base: T): T =>
    typeof a[key] === 'object' && a[key] !== null
      ? { ...base, ...(a[key] as Record<string, unknown>) }
      : base;
  const scalar = <T>(key: string, base: T): T => (a[key] !== undefined ? (a[key] as T) : base);

  return {
    mode: scalar('mode', d.mode),
    preset: scalar('preset', d.preset),
    theme: scalar('theme', d.theme),
    font: scalar('font', d.font),
    fontH: scalar('fontH', d.fontH),
    colors: group('colors', d.colors),
    radius: group('radius', d.radius),
    border: group('border', d.border),
    focus: group('focus', d.focus),
    motion: group('motion', d.motion),
    density: scalar('density', d.density),
    button: group('button', d.button),
    modal: group('modal', d.modal),
    chat: group('chat', d.chat),
    launcher: group('launcher', d.launcher),
    inline: group('inline', d.inline),
    hero: group('hero', d.hero),
  };
}

// Types whose config is the per-type FieldTypeConfig (everything but select / checkbox / honeypot).
const TYPE_CONFIG_TYPES = new Set(['text', 'email', 'phone', 'textarea', 'date', 'file']);

const CHOICE_STYLES: readonly ChoiceStyleId[] = [
  'radio',
  'dropdown',
  'segment',
  'checkbox',
  'tags',
  'chips',
];

function isChoiceStyle(value: unknown): value is ChoiceStyleId {
  return typeof value === 'string' && (CHOICE_STYLES as readonly string[]).includes(value);
}

// A blank choice config (radio / single). Used when seeding a new select field or when an
// existing select row predates the choice config (defensive).
export function defaultChoiceConfig(): ChoiceConfig {
  return {
    style: 'radio',
    defaults: [],
    other: false,
    otherConfig: {
      label: 'その他',
      placeholder: '具体的にご記入ください',
      required: false,
      maxLen: 0,
    },
    countRule: { minOn: false, min: 1, maxOn: false, max: 3 },
    image: { enabled: false, layout: 'card', cols: 2, ratio: '1:1' },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toChoiceConfig(raw: unknown): ChoiceConfig {
  const base = defaultChoiceConfig();
  const c = asRecord(raw);
  const style: ChoiceStyleId = isChoiceStyle(c['style']) ? c['style'] : base.style;
  const oc = asRecord(c['other_config']);
  const cr = asRecord(c['count_rule']);
  const img = asRecord(c['image']);
  const layout: ChoiceCardLayout = img['layout'] === 'list' ? 'list' : 'card';
  const ratio: ChoiceRatio =
    img['ratio'] === '4:3' || img['ratio'] === '16:9' ? img['ratio'] : '1:1';

  return {
    style,
    defaults: Array.isArray(c['defaults'])
      ? c['defaults'].filter((v): v is string => typeof v === 'string')
      : [],
    other: c['other'] === true,
    otherConfig: {
      label:
        typeof oc['label'] === 'string' && oc['label'] !== ''
          ? oc['label']
          : base.otherConfig.label,
      placeholder:
        typeof oc['placeholder'] === 'string' ? oc['placeholder'] : base.otherConfig.placeholder,
      required: oc['required'] === true,
      maxLen: typeof oc['max_len'] === 'number' ? oc['max_len'] : 0,
    },
    countRule: {
      minOn: cr['min_on'] === true,
      min: typeof cr['min'] === 'number' ? cr['min'] : 1,
      maxOn: cr['max_on'] === true,
      max: typeof cr['max'] === 'number' ? cr['max'] : 3,
    },
    image: {
      enabled: img['enabled'] === true,
      layout,
      cols: img['cols'] === 3 ? 3 : 2,
      ratio,
    },
  };
}

export function toContactForm(dto: ContactFormDto): ContactForm {
  return {
    id: dto.id,
    name: dto.name,
    publicFormKey: dto.public_form_key,
    defaultLocale: dto.default_locale,
    locales: dto.locales,
    status: dto.status ?? 'active',
    consentRequired: dto.consent_required ?? false,
  };
}

export function toContactFormList(dto: ContactFormListDto): ContactFormList {
  return {
    items: (dto.items ?? []).map(toContactForm),
    total: dto.total ?? 0,
  };
}

// ChoiceConfig (camelCase draft) → API config object (snake_case). The backend re-normalizes
// and clamps, so this just maps shapes.
function fromChoiceConfig(
  choice: ChoiceConfig,
): NonNullable<CreateContactFormDto['fields'][number]['config']> {
  return {
    style: choice.style,
    defaults: choice.defaults,
    other: choice.other,
    other_config: {
      label: choice.otherConfig.label,
      placeholder: choice.otherConfig.placeholder,
      required: choice.otherConfig.required,
      max_len: choice.otherConfig.maxLen,
    },
    count_rule: {
      min_on: choice.countRule.minOn,
      min: choice.countRule.min,
      max_on: choice.countRule.maxOn,
      max: choice.countRule.max,
    },
    image: {
      enabled: choice.image.enabled,
      layout: choice.image.layout,
      cols: choice.image.cols,
      ratio: choice.image.ratio,
    },
  };
}

// API per-type config (snake_case) → camelCase FieldTypeConfig, merged onto the type defaults so
// the result is always complete even if the row predates a key. The backend re-normalizes on save.
function toFieldTypeConfig(type: string, raw: unknown): FieldTypeConfig | null {
  const base = defaultFieldTypeConfig(type);
  if (base === null) {
    return null;
  }
  const c = asRecord(raw);
  const bool = (key: string, fallback: boolean): boolean => {
    const v = c[key];
    return typeof v === 'boolean' ? v : fallback;
  };
  const num = (key: string, fallback: number): number => {
    const v = c[key];
    return typeof v === 'number' ? v : fallback;
  };
  const str = (key: string, fallback: string): string => {
    const v = c[key];
    return typeof v === 'string' ? v : fallback;
  };

  switch (type) {
    case 'text':
    case 'textarea': {
      const cl = base as Extract<FieldTypeConfig, { counter: boolean }>;
      const shared = {
        minOn: bool('min_on', cl.minOn),
        min: num('min', cl.min),
        maxOn: bool('max_on', cl.maxOn),
        max: num('max', cl.max),
        counter: bool('counter', cl.counter),
      };
      return type === 'text'
        ? { format: str('format', 'none') as 'none' | 'kana' | 'alnum', ...shared }
        : { rows: str('rows', 'md') as 'sm' | 'md' | 'lg', ...shared };
    }
    case 'email':
      return {
        confirm: bool('confirm', false),
        domainMode: str('domain_mode', 'none') as 'none' | 'allow' | 'block',
        domains: str('domains', ''),
        autoreply: bool('autoreply', false),
      };
    case 'phone':
      return { format: str('format', 'jp') as 'jp' | 'jp-nohyphen' | 'intl' };
    case 'date':
      return {
        mode: str('mode', 'date') as 'date' | 'datetime' | 'time',
        range: str('range', 'none') as 'none' | 'future' | 'past' | 'between',
        from: str('from', ''),
        to: str('to', ''),
        def: str('def', 'none') as 'none' | 'today',
      };
    case 'file': {
      const size = num('max_size', 10);
      return {
        fmtImage: bool('fmt_image', true),
        fmtPdf: bool('fmt_pdf', true),
        fmtDoc: bool('fmt_doc', false),
        maxSize: size === 5 || size === 25 ? size : 10,
        multiple: bool('multiple', false),
        maxCount: num('max_count', 3),
      };
    }
    default:
      return base;
  }
}

// camelCase FieldTypeConfig → API per-type config (snake_case). The backend re-normalizes.
function fromFieldTypeConfig(type: string, config: FieldTypeConfig): Record<string, unknown> {
  switch (type) {
    case 'text':
    case 'textarea': {
      const c = config as Extract<FieldTypeConfig, { counter: boolean }>;
      const shared = {
        min_on: c.minOn,
        min: c.min,
        max_on: c.maxOn,
        max: c.max,
        counter: c.counter,
      };
      return type === 'text'
        ? { format: (c as { format: string }).format, ...shared }
        : { rows: (c as { rows: string }).rows, ...shared };
    }
    case 'email': {
      const c = config as {
        confirm: boolean;
        domainMode: string;
        domains: string;
        autoreply: boolean;
      };
      return {
        confirm: c.confirm,
        domain_mode: c.domainMode,
        domains: c.domains,
        autoreply: c.autoreply,
      };
    }
    case 'phone':
      return { format: (config as { format: string }).format };
    case 'date': {
      const c = config as { mode: string; range: string; from: string; to: string; def: string };
      return { mode: c.mode, range: c.range, from: c.from, to: c.to, def: c.def };
    }
    case 'file': {
      const c = config as {
        fmtImage: boolean;
        fmtPdf: boolean;
        fmtDoc: boolean;
        maxSize: number;
        multiple: boolean;
        maxCount: number;
      };
      return {
        fmt_image: c.fmtImage,
        fmt_pdf: c.fmtPdf,
        fmt_doc: c.fmtDoc,
        max_size: c.maxSize,
        multiple: c.multiple,
        max_count: c.maxCount,
      };
    }
    default:
      return {};
  }
}

function toDraftOption(option: Record<string, unknown>): DraftFieldOption {
  const value = option['value'];
  const label = option['label'];
  const description = option['description'];
  const result: DraftFieldOption = {
    value: typeof value === 'string' ? value : '',
    label: label !== null && typeof label === 'object' ? (label as Record<string, string>) : {},
  };
  if (description !== null && typeof description === 'object') {
    result.description = description as Record<string, string>;
  }
  if (option['image'] === true) {
    result.image = true;
  }
  return result;
}

// Seed the builder from an existing form (edit mode). Field ids become the client-only
// stable keys for drag-to-reorder; they are dropped again by toCreateContactFormDto.
export function toContactFormDraft(dto: ContactFormDto): ContactFormDraft {
  const fields: DraftField[] = dto.fields.map((field) => ({
    id: field.id !== undefined ? String(field.id) : crypto.randomUUID(),
    fieldType: field.field_type,
    name: field.name,
    label: field.label,
    description: (field as { description?: string }).description ?? '',
    placeholder: field.placeholder ?? '',
    required: field.required ?? false,
    options: field.options != null ? field.options.map((option) => toDraftOption(option)) : null,
    choice:
      field.field_type === 'select' ? toChoiceConfig((field as { config?: unknown }).config) : null,
    typeConfig: TYPE_CONFIG_TYPES.has(field.field_type)
      ? toFieldTypeConfig(field.field_type, (field as { config?: unknown }).config)
      : null,
  }));

  return {
    name: dto.name,
    description: dto.description ?? '',
    publicFormKey: dto.public_form_key,
    defaultLocale: dto.default_locale,
    locales: dto.locales,
    allowedOrigins: dto.allowed_origins ?? [],
    consentRequired: dto.consent_required ?? false,
    consentLabel: dto.consent_label ?? null,
    retentionDays: dto.retention_days ?? null,
    appearance: toAppearance((dto as { appearance?: unknown }).appearance),
    submitLabel: dto.submit_label ?? null,
    postSubmit: dto.post_submit ?? 'message',
    successMessage: dto.success_message ?? null,
    redirectUrl: dto.redirect_url ?? null,
    adminNotificationSubject: dto.admin_notification_subject ?? null,
    adminNotificationBody: dto.admin_notification_body ?? null,
    fields,
  };
}

// Full form for the read-only detail view (draft + server-owned identity).
export function toContactFormDetail(dto: ContactFormDto): ContactFormDetail {
  return {
    ...toContactFormDraft(dto),
    id: dto.id,
    publicFormKey: dto.public_form_key,
    status: dto.status ?? 'active',
  };
}

export function toCreateContactFormDto(draft: ContactFormDraft): CreateContactFormDto {
  return {
    name: draft.name,
    ...(draft.description.trim() !== '' ? { description: draft.description } : {}),
    ...(draft.publicFormKey.trim() !== '' ? { public_form_key: draft.publicFormKey } : {}),
    default_locale: draft.defaultLocale,
    locales: draft.locales,
    allowed_origins: draft.allowedOrigins,
    consent_required: draft.consentRequired,
    ...(draft.consentLabel !== null ? { consent_label: draft.consentLabel } : {}),
    ...(draft.retentionDays !== null ? { retention_days: draft.retentionDays } : {}),
    appearance: { ...draft.appearance },
    ...(draft.submitLabel !== null ? { submit_label: draft.submitLabel } : {}),
    post_submit: draft.postSubmit,
    ...(draft.successMessage !== null ? { success_message: draft.successMessage } : {}),
    ...(draft.redirectUrl !== null && draft.redirectUrl.trim() !== ''
      ? { redirect_url: draft.redirectUrl }
      : {}),
    ...(draft.adminNotificationSubject !== null && draft.adminNotificationSubject.trim() !== ''
      ? { admin_notification_subject: draft.adminNotificationSubject }
      : {}),
    ...(draft.adminNotificationBody !== null && draft.adminNotificationBody.trim() !== ''
      ? { admin_notification_body: draft.adminNotificationBody }
      : {}),
    fields: draft.fields.map((field) => ({
      field_type: field.fieldType as CreateContactFormDto['fields'][number]['field_type'],
      name: field.name,
      label: field.label,
      ...(field.placeholder.trim() !== '' ? { placeholder: field.placeholder } : {}),
      ...(field.description.trim() !== '' ? { description: field.description } : {}),
      required: field.required,
      ...(field.options !== null
        ? {
            options: field.options.map((option) => ({
              value: option.value,
              label: option.label,
              ...(option.description !== undefined ? { description: option.description } : {}),
              ...(option.image === true ? { image: true } : {}),
            })),
          }
        : {}),
      ...(field.fieldType === 'select' && field.choice != null
        ? { config: fromChoiceConfig(field.choice) }
        : TYPE_CONFIG_TYPES.has(field.fieldType) && field.typeConfig != null
          ? { config: fromFieldTypeConfig(field.fieldType, field.typeConfig) }
          : {}),
    })),
  };
}
