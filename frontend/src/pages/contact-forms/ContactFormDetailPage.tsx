import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import { useContactFormQuery } from '@/entities/contact-form';

export function ContactFormDetailPage(): ReactNode {
  const { id } = useParams();
  const formId = id !== undefined && /^\d+$/.test(id) ? Number(id) : null;

  if (formId === null) {
    return <NotFound />;
  }
  return <Detail id={formId} />;
}

function NotFound(): ReactNode {
  const { t } = useI18n();
  return (
    <div className="fm-body">
      <div className="fm-card fm-empty">
        <div className="e-ico">
          <Icon name="forms" size={26} />
        </div>
        <h3>{t('contactForms.notFound')}</h3>
        <Link className="ex-btn ghost" to="/contact-forms">
          <Icon name="arrowLeft" size={14} />
          {t('channels.back')}
        </Link>
      </div>
    </div>
  );
}

function Detail({ id }: { id: number }): ReactNode {
  const { t } = useI18n();
  const query = useContactFormQuery(id);

  if (query.isPending) {
    return <div className="fm-body fm-state">{t('common.loading')}</div>;
  }
  if (query.error !== null) {
    return <NotFound />;
  }

  const form = query.data;
  const idStr = String(form.id);
  const consentLabel = form.consentRequired ? form.consentLabel?.[form.defaultLocale] : undefined;

  return (
    <div className="fm-body">
      <Link className="ch-back" to="/contact-forms">
        <Icon name="arrowLeft" size={15} />
        {t('channels.back')}
      </Link>

      <div className="fm-head">
        <h1>{form.name}</h1>
        <StatusBadge status={form.status} />
        <span className="sp" />
        <Link className="fm-gbtn" to={`/contact-forms/${idStr}/channels`}>
          <Icon name="bell" size={14} />
          {t('contactForms.notify')}
        </Link>
        <Link className="ex-btn" to={`/contact-forms/${idStr}/edit`}>
          <Icon name="edit" size={14} />
          {t('contactForms.edit')}
        </Link>
      </div>

      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="forms" size={15} />
          <h3>{t('contactForms.detail.overview')}</h3>
        </div>
        <dl className="cf-props">
          <dt>{t('contactForms.detail.publicKey')}</dt>
          <dd>
            <code className="cf-key">{form.publicFormKey}</code>
            <CopyButton value={form.publicFormKey} />
          </dd>

          <dt>{t('contactForms.column.status')}</dt>
          <dd>
            <StatusBadge status={form.status} />
          </dd>

          <dt>{t('contactForms.column.locales')}</dt>
          <dd>
            <span className="fm-langs">
              {form.locales.map((locale) => (
                <span key={locale} className="fm-lang">
                  {locale}
                </span>
              ))}
            </span>
          </dd>

          <dt>{t('contactForms.detail.defaultLocale')}</dt>
          <dd>{form.defaultLocale}</dd>

          <dt>{t('contactForms.detail.consent')}</dt>
          <dd>
            {!form.consentRequired
              ? t('contactForms.detail.consentOff')
              : consentLabel !== undefined && consentLabel !== ''
                ? `${t('contactForms.detail.consentOn')} — ${consentLabel}`
                : t('contactForms.detail.consentOn')}
          </dd>

          <dt>{t('contactForms.detail.retention')}</dt>
          <dd>
            {form.retentionDays !== null
              ? t('contactForms.detail.retentionDays', { n: String(form.retentionDays) })
              : t('contactForms.detail.retentionDefault')}
          </dd>

          <dt>{t('contactForms.detail.origins')}</dt>
          <dd>
            {form.allowedOrigins.length > 0 ? (
              <span className="cf-origins">
                {form.allowedOrigins.map((origin) => (
                  <code key={origin}>{origin}</code>
                ))}
              </span>
            ) : (
              t('contactForms.detail.originsAny')
            )}
          </dd>
        </dl>
      </div>

      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="list" size={15} />
          <h3>{t('contactForms.detail.fields', { n: String(form.fields.length) })}</h3>
        </div>
        <table className="fm-tbl">
          <thead>
            <tr>
              <th>{t('contactForms.detail.type')}</th>
              <th>{t('builder.fieldName')}</th>
              <th>{t('contactForms.detail.label')}</th>
              <th>{t('contactForms.detail.required')}</th>
            </tr>
          </thead>
          <tbody>
            {form.fields.map((field) => (
              <tr key={field.id}>
                <td>{t(`builder.type.${field.fieldType}` as MessageKey)}</td>
                <td>
                  <code className="cf-key">{field.name}</code>
                </td>
                <td>{field.label[form.defaultLocale] ?? '—'}</td>
                <td>
                  {field.required
                    ? t('contactForms.detail.required')
                    : t('contactForms.detail.optional')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): ReactNode {
  const { t } = useI18n();
  return status === 'active' ? (
    <span className="fm-st live">
      <span className="d" />
      {t('contactForms.status.active')}
    </span>
  ) : (
    <span className="fm-st ended">
      <span className="d" />
      {t('contactForms.status.disabled')}
    </span>
  );
}

function CopyButton({ value }: { value: string }): ReactNode {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="fm-copy"
      aria-label={t('contactForms.copyKey')}
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => {
              setCopied(false);
            }, 1500);
          })
          .catch(() => {
            // Clipboard unavailable; nothing to surface.
          });
      }}
    >
      <Icon name={copied ? 'check' : 'copy'} size={13} />
    </button>
  );
}
