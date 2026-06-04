import type { ContactFormDto, ContactFormListDto } from '@/entities/contact-form/api-types';
import type { ContactForm, ContactFormList } from '@/entities/contact-form/model';

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
