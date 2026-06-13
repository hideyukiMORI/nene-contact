import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  defaultAppearance,
  defaultChoiceConfig,
  defaultFieldTypeConfig,
  useCreateContactFormMutation,
  useUpdateContactFormMutation,
} from '@/entities/contact-form';
import type { AppError } from '@/shared/api/errors';
import type { ContactForm, ContactFormDraft, DraftField } from '@/entities/contact-form';
import type { SupportedLocale } from '@/shared/i18n/locales';

function newField(fieldType: string): DraftField {
  const id = crypto.randomUUID();
  return {
    id,
    fieldType,
    // The builder UI no longer exposes the field key (spec v1.0); generate a stable, unique
    // one so submissions/embeds have a usable name without the operator managing it.
    name: `field_${id.slice(0, 8)}`,
    label: {},
    description: '',
    placeholder: '',
    required: false,
    options: fieldType === 'select' ? [] : null,
    // Choice fields carry a declarative display config (builder spec v2.0); other types carry a
    // per-type config (field-config UI).
    choice: fieldType === 'select' ? defaultChoiceConfig() : null,
    typeConfig: fieldType === 'select' ? null : defaultFieldTypeConfig(fieldType),
  };
}

const initialDraft: ContactFormDraft = {
  name: '',
  description: '',
  publicFormKey: '',
  defaultLocale: 'ja',
  locales: ['ja'],
  allowedOrigins: [],
  consentRequired: false,
  consentLabel: null,
  retentionDays: null,
  appearance: defaultAppearance(),
  fields: [],
};

export interface FormBuilder {
  draft: ContactFormDraft;
  error: AppError | null;
  isPending: boolean;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setPublicFormKey: (publicFormKey: string) => void;
  toggleLocale: (locale: SupportedLocale) => void;
  setDefaultLocale: (locale: SupportedLocale) => void;
  toggleConsent: () => void;
  setConsentLabel: (locale: string, value: string) => void;
  setRetentionDays: (days: number | null) => void;
  setAllowedOrigins: (origins: string[]) => void;
  addField: (fieldType: string) => string;
  duplicateField: (id: string) => string | null;
  removeField: (id: string) => void;
  moveField: (fromId: string, toId: string) => void;
  updateField: (id: string, patch: Partial<Omit<DraftField, 'id'>>) => void;
  setFieldLabel: (id: string, locale: string, value: string) => void;
  submit: () => Promise<ContactForm>;
}

export function useFormBuilder(seed?: ContactFormDraft, formId?: number): FormBuilder {
  // Seed from a preset/template (create) or an existing form (edit); lazy init captures it once.
  const [draft, setDraft] = useState<ContactFormDraft>(() => seed ?? initialDraft);
  const createMutation = useCreateContactFormMutation();
  const updateMutation = useUpdateContactFormMutation();
  // editId is fixed for the lifetime of the builder (the route id never changes mid-edit).
  const [editId] = useState(formId);
  const mutation = editId !== undefined ? updateMutation : createMutation;

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
    setDescription: (description) => {
      setDraft((d) => ({ ...d, description }));
    },
    setPublicFormKey: (publicFormKey) => {
      setDraft((d) => ({ ...d, publicFormKey }));
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
    duplicateField: (id) => {
      const source = draft.fields.find((f) => f.id === id);
      if (source === undefined) {
        return null;
      }
      const newId = crypto.randomUUID();
      const copy: DraftField = {
        ...source,
        id: newId,
        name: `field_${newId.slice(0, 8)}`,
        // Deep-copy the nested config the editors mutate so the clone is independent.
        options: source.options !== null ? source.options.map((o) => ({ ...o })) : null,
        choice:
          source.choice != null
            ? { ...source.choice, defaults: [...source.choice.defaults] }
            : null,
        typeConfig: source.typeConfig != null ? { ...source.typeConfig } : null,
      };
      setDraft((d) => {
        const index = d.fields.findIndex((f) => f.id === id);
        const fields = d.fields.slice();
        fields.splice(index + 1, 0, copy);
        return { ...d, fields };
      });
      return newId;
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
    submit: () =>
      editId !== undefined
        ? updateMutation.mutateAsync({ id: editId, draft })
        : createMutation.mutateAsync(draft),
  };
}
