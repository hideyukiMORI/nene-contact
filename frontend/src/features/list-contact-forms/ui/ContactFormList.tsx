import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon, Modal } from '@/shared/ui';
import { useContactForms } from '@/features/list-contact-forms/hooks/use-contact-forms';
import { EmbedModal } from '@/features/embed-form';
import { useDeleteContactFormMutation } from '@/entities/contact-form';
import type { ContactForm } from '@/entities/contact-form';

export type FormStatusFilter = 'all' | 'active' | 'disabled';

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
      className="fm-copy"
      onClick={onCopy}
      title={t('contactForms.copyKey')}
      aria-label={t('contactForms.copyKey')}
    >
      <Icon name={copied ? 'check' : 'copy'} size={13} />
    </button>
  );
}

export function ContactFormList({
  statusFilter = 'all',
  query = '',
}: {
  statusFilter?: FormStatusFilter;
  query?: string;
}): ReactNode {
  const { t } = useI18n();
  const { forms, isLoading, error, refetch } = useContactForms();
  const [embedForm, setEmbedForm] = useState<ContactForm | null>(null);
  const [deleteForm, setDeleteForm] = useState<ContactForm | null>(null);
  const deleteMutation = useDeleteContactFormMutation();

  if (isLoading) {
    return <div className="fm-card fm-state">{t('common.loading')}</div>;
  }

  if (error !== null) {
    return (
      <div className="fm-card fm-empty">
        <div className="au-note" role="alert">
          {t('contactForms.error')}
        </div>
        <button type="button" className="ex-btn ghost" onClick={refetch}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="fm-card fm-empty">
        <div className="e-ico">
          <Icon name="forms" size={26} />
        </div>
        <h3>{t('contactForms.emptyTitle')}</h3>
        <p>{t('contactForms.emptyBody')}</p>
        <Link className="ex-btn" to="/contact-forms/new">
          <Icon name="plus" size={14} />
          {t('contactForms.createFirst')}
        </Link>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const visible = forms.filter(
    (f) =>
      (statusFilter === 'all' || f.status === statusFilter) &&
      (needle === '' || f.name.toLowerCase().includes(needle)),
  );

  return (
    <>
      <div className="fm-card">
        <table className="fm-tbl">
          <thead>
            <tr>
              <th>{t('contactForms.column.name')}</th>
              <th>{t('contactForms.column.locales')}</th>
              <th>{t('contactForms.column.status')}</th>
              <th className="act" aria-label={t('contactForms.column.actions')} />
            </tr>
          </thead>
          <tbody>
            {visible.map((form) => (
              <tr key={form.id}>
                <td>
                  <div className="fm-name">
                    <span className="fm-ic">
                      <Icon name="forms" size={19} />
                    </span>
                    <div>
                      <div className="t">{form.name}</div>
                      <div className="u">
                        {form.publicFormKey}
                        <CopyKeyButton value={form.publicFormKey} />
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="fm-langs">
                    {form.locales.map((locale) => (
                      <span key={locale} className="fm-lang">
                        {locale}
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  {form.status === 'active' ? (
                    <span className="fm-st live">
                      <span className="d" />
                      {t('contactForms.status.active')}
                    </span>
                  ) : (
                    <span className="fm-st ended">
                      <span className="d" />
                      {t('contactForms.status.disabled')}
                    </span>
                  )}
                </td>
                <td>
                  <div className="fm-actions">
                    <button
                      type="button"
                      className="fm-gbtn"
                      onClick={() => {
                        setEmbedForm(form);
                      }}
                    >
                      <Icon name="code" size={14} />
                      {t('contactForms.embed')}
                    </button>
                    <Link className="fm-gbtn" to={`/contact-forms/${String(form.id)}/edit`}>
                      <Icon name="edit" size={14} />
                      {t('contactForms.edit')}
                    </Link>
                    <Link className="fm-gbtn" to={`/contact-forms/${String(form.id)}/channels`}>
                      <Icon name="bell" size={14} />
                      {t('contactForms.notify')}
                    </Link>
                    <button
                      type="button"
                      className="fm-kbtn"
                      aria-label={t('contactForms.delete')}
                      onClick={() => {
                        setDeleteForm(form);
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {embedForm !== null ? (
        <EmbedModal
          form={embedForm}
          onClose={() => {
            setEmbedForm(null);
          }}
        />
      ) : null}

      {deleteForm !== null ? (
        <Modal
          title={t('contactForms.deleteTitle')}
          subtitle={t('contactForms.deleteNote')}
          icon={<Icon name="trash" size={19} />}
          onClose={() => {
            setDeleteForm(null);
          }}
          foot={
            <>
              <button
                type="button"
                className="ex-btn ghost"
                onClick={() => {
                  setDeleteForm(null);
                }}
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                className="ex-btn danger"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(deleteForm.id, {
                    onSuccess: () => {
                      setDeleteForm(null);
                    },
                  });
                }}
              >
                <Icon name="trash" size={14} />
                {deleteMutation.isPending ? t('contactForms.deleting') : t('contactForms.delete')}
              </button>
            </>
          }
        >
          <p className="md-confirm">{t('contactForms.deleteConfirm', { name: deleteForm.name })}</p>
          {deleteMutation.error !== null ? (
            <div className="au-note" role="alert">
              {t('contactForms.deleteError')}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
