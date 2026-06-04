import type {
  ContactFormDto,
  ContactFormListDto,
  CreateContactFormDto,
} from '@/entities/contact-form/api-types';
import type { ContactForm, ContactFormDraft, ContactFormList } from '@/entities/contact-form/model';

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
