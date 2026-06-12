import { defaultChoiceConfig, defaultFieldTypeConfig } from '@/entities/contact-form';
import type { ContactFormDraft, DraftField, DraftFieldOption } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';

/**
 * Starter templates for the new-form builder. Each preset is a factory that returns a fresh
 * {@link ContactFormDraft} (new field ids per call) so first-time operators don't face a blank
 * builder. Presets encode compliant defaults: a honeypot field (ADR 0010) and consent ON when
 * personal data is collected (charter §3); prohibited field types are structurally absent.
 *
 * Field labels are bilingual ja/en data (ADR 0011). The preset's own name/description are
 * message-catalog keys (no hardcoded UI strings).
 */
export interface FormPreset {
  id: string;
  nameKey: MessageKey;
  descKey: MessageKey;
  build: () => ContactFormDraft;
}

const CONSENT_LABEL: Record<string, string> = {
  ja: 'プライバシーポリシーに同意します。',
  en: 'I agree to the privacy policy.',
};

function field(
  fieldType: string,
  name: string,
  label: Record<string, string>,
  required: boolean,
  options: DraftFieldOption[] | null = null,
): DraftField {
  return {
    id: crypto.randomUUID(),
    fieldType,
    name,
    label,
    description: '',
    placeholder: '',
    required,
    options,
    choice: fieldType === 'select' ? defaultChoiceConfig() : null,
    typeConfig: fieldType === 'select' ? null : defaultFieldTypeConfig(fieldType),
  };
}

/** Spam-protection honeypot included on every preset (ADR 0010). */
function honeypot(): DraftField {
  return field('honeypot', 'hp_url', { ja: '', en: '' }, false);
}

function draft(fields: DraftField[], consentRequired: boolean): ContactFormDraft {
  return {
    name: '',
    description: '',
    publicFormKey: '',
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    allowedOrigins: [],
    consentRequired,
    consentLabel: consentRequired ? { ...CONSENT_LABEL } : null,
    retentionDays: null,
    fields,
  };
}

const NAME = (): DraftField => field('text', 'name', { ja: 'お名前', en: 'Name' }, true);
const EMAIL = (): DraftField =>
  field('email', 'email', { ja: 'メールアドレス', en: 'Email' }, true);
const PHONE = (required: boolean): DraftField =>
  field('text', 'phone', { ja: '電話番号', en: 'Phone' }, required);

export const FORM_PRESETS: FormPreset[] = [
  {
    id: 'blank',
    nameKey: 'preset.blank.name',
    descKey: 'preset.blank.desc',
    build: () => draft([], false),
  },
  {
    id: 'contact',
    nameKey: 'preset.contact.name',
    descKey: 'preset.contact.desc',
    build: () =>
      draft(
        [
          NAME(),
          EMAIL(),
          field('textarea', 'message', { ja: 'お問い合わせ内容', en: 'Message' }, true),
          honeypot(),
        ],
        true,
      ),
  },
  {
    id: 'documentRequest',
    nameKey: 'preset.documentRequest.name',
    descKey: 'preset.documentRequest.desc',
    build: () =>
      draft(
        [
          NAME(),
          field('text', 'company', { ja: '会社名', en: 'Company' }, false),
          EMAIL(),
          PHONE(false),
          honeypot(),
        ],
        true,
      ),
  },
  {
    id: 'reservation',
    nameKey: 'preset.reservation.name',
    descKey: 'preset.reservation.desc',
    build: () =>
      draft(
        [
          NAME(),
          EMAIL(),
          PHONE(true),
          field('text', 'preferred_date', { ja: '希望日', en: 'Preferred date' }, true),
          field('textarea', 'note', { ja: '備考', en: 'Notes' }, false),
          honeypot(),
        ],
        true,
      ),
  },
  {
    id: 'recruitment',
    nameKey: 'preset.recruitment.name',
    descKey: 'preset.recruitment.desc',
    build: () =>
      draft(
        [
          NAME(),
          EMAIL(),
          PHONE(true),
          field('file', 'resume', { ja: '履歴書', en: 'Résumé' }, true),
          field('textarea', 'motivation', { ja: '志望動機', en: 'Motivation' }, false),
          honeypot(),
        ],
        true,
      ),
  },
  {
    id: 'support',
    nameKey: 'preset.support.name',
    descKey: 'preset.support.desc',
    build: () =>
      draft(
        [
          EMAIL(),
          field('text', 'subject', { ja: '件名', en: 'Subject' }, true),
          field('textarea', 'description', { ja: 'お問い合わせ内容', en: 'Description' }, true),
          field('select', 'priority', { ja: '優先度', en: 'Priority' }, false, [
            { value: 'low', label: { ja: '低', en: 'Low' } },
            { value: 'normal', label: { ja: '通常', en: 'Normal' } },
            { value: 'high', label: { ja: '高', en: 'High' } },
          ]),
          honeypot(),
        ],
        true,
      ),
  },
];
