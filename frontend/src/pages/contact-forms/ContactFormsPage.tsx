import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { ContactFormList } from '@/features/list-contact-forms';

export function ContactFormsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <section className="nc-card nc-section">
      <h1>{t('contactForms.title')}</h1>
      <ContactFormList />
    </section>
  );
}
