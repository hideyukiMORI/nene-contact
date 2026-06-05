import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useContactForms } from '@/features/list-contact-forms/hooks/use-contact-forms';
import { FormIcon } from '@/features/list-contact-forms/ui/icons';

function CopyKeyButton({ value }: { value: string }): ReactNode {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onCopy = (): void => {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      })
      .catch(() => {
        // Clipboard unavailable or denied; nothing actionable to surface here.
      });
  };

  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={onCopy}
      title={t('contactForms.copyKey')}
      aria-label={t('contactForms.copyKey')}
    >
      <FormIcon name={copied ? 'check' : 'copy'} size={14} />
    </button>
  );
}

export function ContactFormList(): ReactNode {
  const { t } = useI18n();
  const { forms, isLoading, error, refetch } = useContactForms();

  if (isLoading) {
    return (
      <div className="card card-pad">
        <p className="faint">{t('common.loading')}</p>
      </div>
    );
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
    return (
      <div className="card">
        <div className="empty">
          <div className="e-ico">
            <FormIcon name="forms" size={26} />
          </div>
          <h3>{t('contactForms.emptyTitle')}</h3>
          <p>{t('contactForms.emptyBody')}</p>
          <Link className="btn btn-primary" to="/contact-forms/new">
            <FormIcon name="plus" size={16} />
            {t('contactForms.createFirst')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>{t('contactForms.column.name')}</th>
            <th>{t('contactForms.column.key')}</th>
            <th>{t('contactForms.column.locales')}</th>
            <th>{t('contactForms.column.status')}</th>
            <th className="col-actions">{t('contactForms.column.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.id}>
              <td className="cell-strong">{form.name}</td>
              <td>
                <span className="key-cell">
                  <code className="pill-key">{form.publicFormKey}</code>
                  <CopyKeyButton value={form.publicFormKey} />
                </span>
              </td>
              <td>
                <span className="lang-cell">
                  {form.locales.map((locale) => (
                    <span key={locale} className="chip lang">
                      {locale}
                    </span>
                  ))}
                </span>
              </td>
              <td>
                {form.status === 'active' ? (
                  <span className="badge resolved">
                    <span className="dot" />
                    {t('contactForms.status.active')}
                  </span>
                ) : (
                  <span className="chip">{t('contactForms.status.disabled')}</span>
                )}
              </td>
              <td className="col-actions">
                <Link className="btn btn-sm" to={`/contact-forms/${String(form.id)}/channels`}>
                  <FormIcon name="bell" size={15} />
                  {t('contactForms.notify')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
