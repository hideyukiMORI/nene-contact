import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { ContactFormList } from '@/features/list-contact-forms';

export function ContactFormsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <section className="nc-card nc-section">
      <div className="nc-nav">
        <h1>{t('contactForms.title')}</h1>
        <span className="nc-nav-spacer" />
        <Link to="/contact-forms/new">{t('contactForms.new')}</Link>
      </div>
      <ContactFormList />
    </section>
  );
}
