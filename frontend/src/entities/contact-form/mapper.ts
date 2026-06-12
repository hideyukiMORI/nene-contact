import type {
  ContactFormDto,
  ContactFormListDto,
  CreateContactFormDto,
} from '@/entities/contact-form/api-types';
import type {
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
} from '@/entities/contact-form/model';

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
    placeholder: field.placeholder ?? '',
    required: field.required ?? false,
    options: field.options != null ? field.options.map((option) => toDraftOption(option)) : null,
    choice:
      field.field_type === 'select' ? toChoiceConfig((field as { config?: unknown }).config) : null,
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
    fields: draft.fields.map((field) => ({
      field_type: field.fieldType as CreateContactFormDto['fields'][number]['field_type'],
      name: field.name,
      label: field.label,
      ...(field.placeholder.trim() !== '' ? { placeholder: field.placeholder } : {}),
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
        : {}),
    })),
  };
}
