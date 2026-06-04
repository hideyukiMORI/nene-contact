import { describe, expect, it } from 'vitest';
import { toContactForm, toContactFormList } from '@/entities/contact-form/mapper';

describe('contact-form mappers', () => {
  it('maps a contact form DTO to the model', () => {
    const model = toContactForm({
      id: 3,
      name: 'Contact us',
      public_form_key: 'abc',
      default_locale: 'ja',
      locales: ['ja', 'en'],
      status: 'active',
      consent_required: true,
      fields: [],
    });

    expect(model).toEqual({
      id: 3,
      name: 'Contact us',
      publicFormKey: 'abc',
      defaultLocale: 'ja',
      locales: ['ja', 'en'],
      status: 'active',
      consentRequired: true,
    });
  });

  it('defaults a missing list to empty', () => {
    expect(toContactFormList({})).toEqual({ items: [], total: 0 });
  });
});
