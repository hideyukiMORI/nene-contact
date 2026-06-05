import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { ContactFormList } from '@/features/list-contact-forms';
import { FormIcon } from '@/features/list-contact-forms/ui/icons';

export function ContactFormsPage(): ReactNode {
  const { t } = useI18n();

  return (
    <>
      <div className="page-head page-head-row">
        <div className="grow">
          <h1>{t('contactForms.title')}</h1>
          <p className="lead">{t('contactForms.lead')}</p>
        </div>
        <Link className="btn btn-primary" to="/contact-forms/new">
          <FormIcon name="plus" size={16} />
          {t('contactForms.new')}
        </Link>
      </div>
      <ContactFormList />
    </>
  );
}
