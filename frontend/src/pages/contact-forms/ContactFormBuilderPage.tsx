import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import type { ContactFormDraft } from '@/entities/contact-form';
import { useContactFormQuery } from '@/entities/contact-form';
import { useI18n } from '@/shared/i18n';
import { FormBuilder, PresetPicker } from '@/features/build-contact-form';

export function ContactFormBuilderPage(): ReactNode {
  const { id } = useParams();
  const editId = id !== undefined && /^\d+$/.test(id) ? Number(id) : null;

  if (editId !== null) {
    return <EditForm id={editId} />;
  }
  return <CreateForm />;
}

// Edit mode: load the existing form as a draft, then open the builder against it (PUT on save).
function EditForm({ id }: { id: number }): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  // Deep-link a specific builder tab (e.g. the embed panel's "set allowed sites" link), and
  // optionally focus a field within it (?focus=origins).
  const initialTab =
    tabParam === 'settings' || tabParam === 'design' || tabParam === 'publish'
      ? tabParam
      : undefined;
  const focusField = searchParams.get('focus') ?? undefined;
  const query = useContactFormQuery(id);

  if (query.isPending) {
    return <div className="fm-body fm-state">{t('common.loading')}</div>;
  }
  if (query.error !== null) {
    return (
      <div className="fm-body">
        <div className="fm-card fm-empty">
          <div className="au-note" role="alert">
            {t('builder.loadError')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormBuilder
      initialDraft={query.data}
      formId={id}
      initialTab={initialTab}
      focusField={focusField}
      onBack={() => {
        void navigate('/contact-forms');
      }}
      onCreated={() => {
        void navigate('/contact-forms');
      }}
    />
  );
}

// Create mode: pick a template, then open the blank/seeded builder (POST on save).
function CreateForm(): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
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
