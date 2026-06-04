import { Link, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import type { ContactFormDraft } from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';
import { FormBuilder, PresetPicker } from '@/features/build-contact-form';

export function ContactFormBuilderPage(): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  // null = still choosing a template; otherwise the builder is seeded with the chosen draft.
  const [seed, setSeed] = useState<ContactFormDraft | null>(null);

  return (
    <section className="nc-card nc-section">
      <Link to="/contact-forms">← {t('builder.back')}</Link>
      <h1>{seed === null ? t('preset.pick.title') : t('builder.title')}</h1>
      {seed === null ? (
        <PresetPicker
          onPick={(preset) => {
            setSeed(preset.build());
          }}
        />
      ) : (
        <>
          <button
            type="button"
            className="nc-button nc-muted"
            onClick={() => {
              setSeed(null);
            }}
          >
            ← {t('builder.changeTemplate')}
          </button>
          <FormBuilder
            initialDraft={seed}
            onCreated={() => {
              void navigate('/contact-forms');
            }}
          />
        </>
      )}
    </section>
  );
}
