import { describe, expect, it } from 'vitest';
import {
  toContactForm,
  toContactFormList,
  toCreateContactFormDto,
} from '@/entities/contact-form/mapper';

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

  it('maps a draft to the create request, omitting empty optionals', () => {
    const dto = toCreateContactFormDto({
      name: 'Contact us',
      defaultLocale: 'ja',
      locales: ['ja'],
      allowedOrigins: ['https://example.com'],
      consentRequired: false,
      consentLabel: null,
      retentionDays: null,
      fields: [
        {
          id: 'f1',
          fieldType: 'email',
          name: 'email',
          label: { ja: 'メール' },
          required: true,
          options: null,
        },
      ],
    });

    expect(dto).toEqual({
      name: 'Contact us',
      default_locale: 'ja',
      locales: ['ja'],
      allowed_origins: ['https://example.com'],
      consent_required: false,
      fields: [{ field_type: 'email', name: 'email', label: { ja: 'メール' }, required: true }],
    });
    expect(dto).not.toHaveProperty('consent_label');
    expect(dto).not.toHaveProperty('retention_days');
  });
});
