import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useContactForms } from '@/features/list-contact-forms/hooks/use-contact-forms';

export function ContactFormList(): ReactNode {
  const { t } = useI18n();
  const { forms, isLoading, error, refetch } = useContactForms();

  if (isLoading) {
    return <p>{t('common.loading')}</p>;
  }

  if (error !== null) {
    return (
      <div className="nc-stack">
        <Alert>{t('contactForms.error')}</Alert>
        <Button type="button" onClick={refetch}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (forms.length === 0) {
    return <p className="nc-muted">{t('contactForms.empty')}</p>;
  }

  return (
    <table className="nc-table">
      <thead>
        <tr>
          <th>{t('contactForms.column.name')}</th>
          <th>{t('contactForms.column.key')}</th>
          <th>{t('contactForms.column.locales')}</th>
          <th>{t('contactForms.column.status')}</th>
        </tr>
      </thead>
      <tbody>
        {forms.map((form) => (
          <tr key={form.id}>
            <td>{form.name}</td>
            <td>
              <code>{form.publicFormKey}</code>
            </td>
            <td>{form.locales.join(', ')}</td>
            <td>{form.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
