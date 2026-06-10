import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { useContactFormQuery } from '@/entities/contact-form';
import type { ContactFormDetail, DraftField } from '@/entities/contact-form';

const TYPE_ICON: Record<string, IconName> = {
  text: 'text',
  email: 'mail',
  textarea: 'lines',
  select: 'list',
  checkbox: 'check',
  file: 'file',
  honeypot: 'lock',
};

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

// The form's detail = the builder's representation, read-only (確定版 has no separate
// detail screen). A toolbar + the form sheet preview (bd-canvas) + a settings panel.
function Detail({ id }: { id: number }): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const query = useContactFormQuery(id);

  if (query.isPending) {
    return <div className="fm-body fm-state">{t('common.loading')}</div>;
  }
  if (query.error !== null) {
    return <NotFound />;
  }

  const form = query.data;
  const idStr = String(form.id);

  return (
    <div className="bd-editor">
      <div className="bd-toolbar">
        <button
          type="button"
          className="bd-back"
          aria-label={t('channels.back')}
          onClick={() => {
            void navigate('/contact-forms');
          }}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <span className="bd-tcrumb">{t('builder.formCrumb')} ›</span>
        <span className="bd-tname-static">{form.name}</span>
        <StatusBadge status={form.status} />
        <span className="sp" />
        <Link className="ex-btn ghost" to={`/contact-forms/${idStr}/channels`}>
          <Icon name="bell" size={14} />
          {t('contactForms.notify')}
        </Link>
        <Link className="ex-btn" to={`/contact-forms/${idStr}/edit`}>
          <Icon name="edit" size={14} />
          {t('contactForms.edit')}
        </Link>
      </div>

      <div className="bd-wrap">
        <div className="bd-canvas">
          <div className="bd-sheet">
            <div className="bd-sheethead">
              <div className="bd-ftitle">{form.name}</div>
            </div>
            {form.fields.map((field) => (
              <ReadonlyField key={field.id} field={field} defaultLocale={form.defaultLocale} />
            ))}
          </div>
        </div>

        <div className="bd-panel">
          <div className="bd-psecs">
            <div className="bd-psec">
              <h4>{t('builder.formSettings')}</h4>

              <div className="bd-frow">
                <span className="l">{t('contactForms.detail.publicKey')}</span>
                <div className="v">
                  <code>{form.publicFormKey}</code>
                  <CopyButton value={form.publicFormKey} />
                </div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.column.status')}</span>
                <div className="v">
                  <StatusBadge status={form.status} />
                </div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.column.locales')}</span>
                <div className="v">
                  <span className="fm-langs">
                    {form.locales.map((locale) => (
                      <span key={locale} className="fm-lang">
                        {locale}
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.detail.defaultLocale')}</span>
                <div className="v">{form.defaultLocale}</div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.detail.consent')}</span>
                <div className="v">{consentText(form, t)}</div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.detail.retention')}</span>
                <div className="v">
                  {form.retentionDays !== null
                    ? t('contactForms.detail.retentionDays', { n: String(form.retentionDays) })
                    : t('contactForms.detail.retentionDefault')}
                </div>
              </div>

              <div className="bd-frow">
                <span className="l">{t('contactForms.detail.origins')}</span>
                <div className="v col">
                  {form.allowedOrigins.length > 0 ? (
                    form.allowedOrigins.map((origin) => <code key={origin}>{origin}</code>)
                  ) : (
                    <span>{t('contactForms.detail.originsAny')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function consentText(
  form: ContactFormDetail,
  t: (key: MessageKey, vars?: Record<string, string>) => string,
): string {
  if (!form.consentRequired) {
    return t('contactForms.detail.consentOff');
  }
  const label = form.consentLabel?.[form.defaultLocale];
  return label !== undefined && label !== ''
    ? `${t('contactForms.detail.consentOn')} — ${label}`
    : t('contactForms.detail.consentOn');
}

function ReadonlyField({
  field,
  defaultLocale,
}: {
  field: DraftField;
  defaultLocale: string;
}): ReactNode {
  const { t } = useI18n();
  const label = field.label[defaultLocale]?.trim();
  const heading = label !== undefined && label !== '' ? label : field.name;

  return (
    <div className="bd-field ro">
      <div className="main">
        <div className="bd-flabel">
          {heading}
          {field.required ? <span className="req">＊</span> : null}
        </div>
        <FieldPreview field={field} />
      </div>
      <span className="bd-ftype">
        <Icon name={TYPE_ICON[field.fieldType] ?? 'text'} size={11} />
        {t(`builder.type.${field.fieldType}` as MessageKey)}
      </span>
    </div>
  );
}

function FieldPreview({ field }: { field: DraftField }): ReactNode {
  const { t } = useI18n();
  if (field.fieldType === 'honeypot') {
    return <div className="bd-ro-note">{t('contactForms.detail.hidden')}</div>;
  }
  if (field.fieldType === 'textarea') {
    return <div className="bd-input area" />;
  }
  if (field.fieldType === 'select') {
    const first = field.options?.[0];
    const firstLabel = first !== undefined ? (Object.values(first.label)[0] ?? first.value) : '';
    return (
      <div className="bd-input sel-input">
        <span>{firstLabel}</span>
        <Icon name="chevDown" size={15} />
      </div>
    );
  }
  return <div className="bd-input" />;
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
