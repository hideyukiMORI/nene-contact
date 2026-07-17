import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon, Modal } from '@/shared/ui';
import { useContactForms } from '@/features/list-contact-forms/model/use-contact-forms';
import { EmbedModal } from '@/features/embed-form';
import { useDeleteContactFormMutation } from '@/entities/contact-form';
import { useDuplicateContactForm } from '@/features/list-contact-forms/model/use-duplicate-contact-form';
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
  const navigate = useNavigate();
  const { forms, isLoading, error, refetch } = useContactForms();
  const [embedForm, setEmbedForm] = useState<ContactForm | null>(null);
  const [deleteForm, setDeleteForm] = useState<ContactForm | null>(null);
  const deleteMutation = useDeleteContactFormMutation();
  const duplicate = useDuplicateContactForm();

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
        <div className="tbl-wrap">
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
              {visible.map((form) => {
                const open = (): void => {
                  void navigate(`/contact-forms/${String(form.id)}`);
                };
                const onRowClick = (e: MouseEvent<HTMLTableRowElement>): void => {
                  // Per-form actions (embed / edit / notify / delete) and the copy-key button
                  // own their own behaviour; a click on any of them must not open the form.
                  if ((e.target as HTMLElement).closest('a, button') !== null) return;
                  open();
                };
                const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>): void => {
                  // Only when the row itself has focus — Enter/Space on a child link or button
                  // (edit / notify / delete) bubbles here but must keep its own behaviour.
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    open();
                  }
                };
                return (
                  <tr
                    key={form.id}
                    className="clickable"
                    role="link"
                    tabIndex={0}
                    aria-label={t('contactForms.open', { name: form.name })}
                    onClick={onRowClick}
                    onKeyDown={onRowKeyDown}
                  >
                    <td>
                      <div className="fm-name">
                        <span className="fm-ic">
                          <Icon name="forms" size={19} />
                        </span>
                        <div>
                          <span className="t">{form.name}</span>
                          <div className="u">
                            <span className="fm-keychip">
                              {t('contactForms.publicKeyLabel')}
                              <CopyKeyButton value={form.publicFormKey} />
                            </span>
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
                          className="fm-gbtn"
                          disabled={duplicate.isPending}
                          onClick={() => {
                            duplicate.duplicate(form.id, form.name);
                          }}
                        >
                          <Icon name="copy" size={14} />
                          {t('contactForms.duplicate')}
                        </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
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
