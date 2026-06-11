import { describe, expect, it } from 'vitest';
import {
  toContactForm,
  toContactFormDetail,
  toContactFormDraft,
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
      description: '',
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

  it('maps a form DTO to an editable draft (and survives a round-trip to the request)', () => {
    const draft = toContactFormDraft({
      id: 9,
      name: 'Contact us',
      public_form_key: 'abc',
      default_locale: 'ja',
      locales: ['ja', 'en'],
      allowed_origins: ['https://example.com'],
      status: 'active',
      consent_required: true,
      consent_label: { ja: '同意します' },
      retention_days: 30,
      fields: [
        {
          id: 4,
          field_type: 'select',
          name: 'topic',
          label: { ja: '種別' },
          required: true,
          options: [{ value: 'a', label: { ja: 'A' } }],
          sort_order: 0,
        },
      ],
    });

    expect(draft.name).toBe('Contact us');
    expect(draft.allowedOrigins).toEqual(['https://example.com']);
    expect(draft.consentLabel).toEqual({ ja: '同意します' });
    expect(draft.retentionDays).toBe(30);
    expect(draft.fields).toHaveLength(1);
    expect(draft.fields[0]?.id).toBe('4');
    expect(draft.fields[0]?.options).toEqual([{ value: 'a', label: { ja: 'A' } }]);

    // The draft re-serializes to the request shape used for the PUT.
    const dto = toCreateContactFormDto(draft);
    expect(dto.name).toBe('Contact us');
    expect(dto.fields[0]).toEqual({
      field_type: 'select',
      name: 'topic',
      label: { ja: '種別' },
      required: true,
      options: [{ value: 'a', label: { ja: 'A' } }],
    });
  });

  it('maps a form DTO to the full detail (draft + server identity)', () => {
    const detail = toContactFormDetail({
      id: 9,
      name: 'Contact us',
      public_form_key: 'abc',
      default_locale: 'ja',
      locales: ['ja'],
      allowed_origins: [],
      status: 'disabled',
      consent_required: false,
      fields: [],
    });

    expect(detail.id).toBe(9);
    expect(detail.publicFormKey).toBe('abc');
    expect(detail.status).toBe('disabled');
    // and it still carries the editable draft fields
    expect(detail.name).toBe('Contact us');
    expect(detail.fields).toEqual([]);
  });
});
