import { useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import type { ContactFormDraft } from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';
import { FormBuilder, PresetPicker } from '@/features/build-contact-form';

export function ContactFormBuilderPage(): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  // null = still choosing a template; otherwise the editor is seeded with the chosen draft.
  const [seed, setSeed] = useState<ContactFormDraft | null>(null);

  if (seed === null) {
    return (
      <div className="fm-body">
        <div className="fm-head">
          <h1>{t('preset.pick.title')}</h1>
          <span className="sp" />
        </div>
        <p className="ex-lead">{t('preset.pick.subtitle')}</p>
        <PresetPicker
          onPick={(preset) => {
            setSeed(preset.build());
          }}
        />
      </div>
    );
  }

  return (
    <FormBuilder
      initialDraft={seed}
      onBack={() => {
        setSeed(null);
      }}
      onCreated={() => {
        void navigate('/contact-forms');
      }}
    />
  );
}
