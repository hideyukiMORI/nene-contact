import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { FormBuilder } from '@/features/build-contact-form';

export function ContactFormBuilderPage(): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <section className="nc-card nc-section">
      <Link to="/contact-forms">← {t('builder.back')}</Link>
      <h1>{t('builder.title')}</h1>
      <FormBuilder
        onCreated={() => {
          void navigate('/contact-forms');
        }}
      />
    </section>
  );
}
