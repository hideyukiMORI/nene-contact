import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useCreateContactFormMutation } from '@/entities/contact-form';
import type { AppError } from '@/shared/api/errors';
import type { ContactForm, ContactFormDraft, DraftField } from '@/entities/contact-form';
import type { SupportedLocale } from '@/shared/i18n/locales';

// Field types offered by the palette — the closed allowlist (the API rejects others; My
// Number / card types are structurally absent, charter §8 / ADR 0016).
export const PALETTE_FIELD_TYPES = [
  'text',
  'email',
  'textarea',
  'select',
  'checkbox',
  'file',
  'honeypot',
] as const;

function newField(fieldType: string): DraftField {
  return {
    id: crypto.randomUUID(),
    fieldType,
    name: '',
    label: {},
    required: false,
    options: fieldType === 'select' ? [] : null,
  };
}

const initialDraft: ContactFormDraft = {
  name: '',
  defaultLocale: 'ja',
  locales: ['ja'],
  allowedOrigins: [],
  consentRequired: false,
  consentLabel: null,
  retentionDays: null,
  fields: [],
};

export interface FormBuilder {
  draft: ContactFormDraft;
  error: AppError | null;
  isPending: boolean;
  setName: (name: string) => void;
  toggleLocale: (locale: SupportedLocale) => void;
  setDefaultLocale: (locale: SupportedLocale) => void;
  toggleConsent: () => void;
  setConsentLabel: (locale: string, value: string) => void;
  setRetentionDays: (days: number | null) => void;
  setAllowedOrigins: (origins: string[]) => void;
  addField: (fieldType: string) => string;
  removeField: (id: string) => void;
  moveField: (fromId: string, toId: string) => void;
  updateField: (id: string, patch: Partial<Omit<DraftField, 'id'>>) => void;
  setFieldLabel: (id: string, locale: string, value: string) => void;
  setFieldOptionValues: (id: string, values: string[]) => void;
  submit: () => Promise<ContactForm>;
}

export function useFormBuilder(seed?: ContactFormDraft): FormBuilder {
  // Seed from a preset/template when provided (lazy init so the seed is captured once).
  const [draft, setDraft] = useState<ContactFormDraft>(() => seed ?? initialDraft);
  const mutation = useCreateContactFormMutation();

  const patchField = (id: string, patch: Partial<Omit<DraftField, 'id'>>): void => {
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  return {
    draft,
    error: mutation.error,
    isPending: mutation.isPending,
    setName: (name) => {
      setDraft((d) => ({ ...d, name }));
    },
    toggleLocale: (locale) => {
      setDraft((d) => {
        if (d.locales.includes(locale)) {
          if (d.locales.length === 1) {
            return d;
          }
          const locales = d.locales.filter((l) => l !== locale);
          // locales is non-empty here (length was > 1 before the filter); fall back defensively.
          const defaultLocale =
            d.defaultLocale === locale ? (locales[0] ?? d.defaultLocale) : d.defaultLocale;
          return { ...d, locales, defaultLocale };
        }
        return { ...d, locales: [...d.locales, locale] };
      });
    },
    setDefaultLocale: (locale) => {
      setDraft((d) => (d.locales.includes(locale) ? { ...d, defaultLocale: locale } : d));
    },
    toggleConsent: () => {
      setDraft((d) => ({
        ...d,
        consentRequired: !d.consentRequired,
        consentLabel: d.consentRequired ? null : (d.consentLabel ?? {}),
      }));
    },
    setConsentLabel: (locale, value) => {
      setDraft((d) => ({ ...d, consentLabel: { ...(d.consentLabel ?? {}), [locale]: value } }));
    },
    setRetentionDays: (days) => {
      setDraft((d) => ({ ...d, retentionDays: days }));
    },
    setAllowedOrigins: (origins) => {
      setDraft((d) => ({ ...d, allowedOrigins: origins }));
    },
    addField: (fieldType) => {
      const field = newField(fieldType);
      setDraft((d) => ({ ...d, fields: [...d.fields, field] }));
      return field.id;
    },
    removeField: (id) => {
      setDraft((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) }));
    },
    moveField: (fromId, toId) => {
      setDraft((d) => {
        const from = d.fields.findIndex((f) => f.id === fromId);
        const to = d.fields.findIndex((f) => f.id === toId);
        if (from === -1 || to === -1) {
          return d;
        }
        return { ...d, fields: arrayMove(d.fields, from, to) };
      });
    },
    updateField: patchField,
    setFieldLabel: (id, locale, value) => {
      setDraft((d) => ({
        ...d,
        fields: d.fields.map((f) =>
          f.id === id ? { ...f, label: { ...f.label, [locale]: value } } : f,
        ),
      }));
    },
    setFieldOptionValues: (id, values) => {
      patchField(id, {
        options: values.map((value) => ({ value, label: { [draft.defaultLocale]: value } })),
      });
    },
    submit: () => mutation.mutateAsync(draft),
  };
}
