import type {
  ContactFormDto,
  ContactFormListDto,
  CreateContactFormDto,
} from '@/entities/contact-form/api-types';
import type {
  ContactForm,
  ContactFormDetail,
  ContactFormDraft,
  ContactFormList,
  DraftField,
  DraftFieldOption,
} from '@/entities/contact-form/model';

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

function toDraftOption(option: Record<string, unknown>): DraftFieldOption {
  const value = option['value'];
  const label = option['label'];
  return {
    value: typeof value === 'string' ? value : '',
    label: label !== null && typeof label === 'object' ? (label as Record<string, string>) : {},
  };
}

// Seed the builder from an existing form (edit mode). Field ids become the client-only
// stable keys for drag-to-reorder; they are dropped again by toCreateContactFormDto.
export function toContactFormDraft(dto: ContactFormDto): ContactFormDraft {
  const fields: DraftField[] = dto.fields.map((field) => ({
    id: field.id !== undefined ? String(field.id) : crypto.randomUUID(),
    fieldType: field.field_type,
    name: field.name,
    label: field.label,
    required: field.required ?? false,
    options: field.options != null ? field.options.map((option) => toDraftOption(option)) : null,
  }));

  return {
    name: dto.name,
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
      required: field.required,
      ...(field.options !== null
        ? { options: field.options.map((option) => ({ value: option.value, label: option.label })) }
        : {}),
    })),
  };
}
