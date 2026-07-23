import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { useFormBuilder } from '@/features/build-contact-form/model/use-form-builder';

type Builder = ReturnType<typeof useFormBuilder>;

// A small switch matching the spec's .bd-switch.
function Switch({
  on,
  label,
  onToggle,
  disabled = false,
}: {
  on: boolean;
  label: string;
  onToggle?: () => void;
  disabled?: boolean;
}): ReactNode {
  return (
    <button
      type="button"
      className={'bd-switch' + (on ? '' : ' off') + (disabled ? ' disabled' : '')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
    />
  );
}

// A "coming soon" badge for not-yet-wired settings (#324).
function SoonBadge(): ReactNode {
  const { t } = useI18n();
  return <span className="soon-badge">{t('common.comingSoon')}</span>;
}

// フォーム設定 tab — an independent, centered single-column page (builder IA spec §2). Basic
// info / submit-after / notifications / spam + language. Backed fields are wired; items still
// marked as proposed in the spec (submit-after, auto-reply, reCAPTCHA, dedupe) are local-only
// and flagged 近日対応 until they get backend support.
export function FormSettingsPage({
  builder,
  readOnlyKey,
}: {
  builder: Builder;
  readOnlyKey: boolean;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;

  const enLocale = draft.locales.includes('en');

  // Admin-notification variable cheat-sheet: reserved tokens + every non-honeypot field by name.
  const reservedVarNames = ['form_name', 'submitted_at', 'message'];
  const adminVarList = [
    `{form_name}（${t('settingsTab.varFormName')}）`,
    `{submitted_at}（${t('settingsTab.varSubmittedAt')}）`,
    `{message}（${t('settingsTab.varMessage')}）`,
    ...draft.fields
      .filter((f) => f.fieldType !== 'honeypot' && !reservedVarNames.includes(f.name))
      .map((f) => `{${f.name}}（${f.label[draft.defaultLocale] ?? f.name}）`),
  ].join(' / ');

  return (
    <div className="bd-sheetscroll">
      <div className="bd-sheet-page">
        <div className="sheet-head">
          <h3>{t('builder.tab2.settings')}</h3>
          <p>{t('settingsTab.lead')}</p>
        </div>

        <div className="scard">
          <h4>
            <Icon name="forms" size={14} />
            {t('settingsTab.basic')}
          </h4>
          <div className="srow">
            <label className="l" htmlFor="st-name">
              {t('settingsTab.nameAdmin')}
            </label>
            <input
              id="st-name"
              className="sinput"
              value={draft.name}
              placeholder={t('builder.untitled')}
              onChange={(e) => {
                builder.setName(e.target.value);
              }}
            />
          </div>
          <div className="srow">
            <label className="l" htmlFor="st-desc">
              {t('settingsTab.description')}
            </label>
            <textarea
              id="st-desc"
              className="sinput area"
              value={draft.description}
              placeholder={t('settingsTab.descriptionPh')}
              onChange={(e) => {
                builder.setDescription(e.target.value);
              }}
            />
          </div>
          <div className="srow">
            <span className="l">{t('settingsTab.publicUrl')}</span>
            <div className="sinput">
              <span className="pfx">{t('builder.publicPathPrefix')}</span>
              <input
                aria-label={t('settingsTab.publicUrl')}
                style={{
                  flex: 1,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  font: 'inherit',
                }}
                value={draft.publicFormKey}
                readOnly={readOnlyKey}
                placeholder={t('builder.publicPathAuto')}
                onChange={(e) => {
                  builder.setPublicFormKey(
                    e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase(),
                  );
                }}
              />
            </div>
          </div>
        </div>

        <div className="scard">
          <h4>
            <Icon name="send" size={14} />
            {t('settingsTab.submit')}
          </h4>
          <div className="srow">
            <label className="l" htmlFor="st-submit-ja">
              {enLocale ? t('settingsTab.submitLabelJa') : t('settingsTab.submitLabel')}
            </label>
            <input
              id="st-submit-ja"
              className="sinput"
              value={draft.submitLabel?.['ja'] ?? ''}
              placeholder={t('settingsTab.submitLabelPh')}
              onChange={(e) => {
                builder.setSubmitLabel('ja', e.target.value);
              }}
            />
          </div>
          {enLocale ? (
            <div className="srow">
              <label className="l" htmlFor="st-submit-en">
                {t('settingsTab.submitLabelEn')}
              </label>
              <input
                id="st-submit-en"
                className="sinput"
                value={draft.submitLabel?.['en'] ?? ''}
                placeholder="Send"
                onChange={(e) => {
                  builder.setSubmitLabel('en', e.target.value);
                }}
              />
            </div>
          ) : null}
          <div className="srow">
            <span className="l">{t('settingsTab.postSubmit')}</span>
            <div className="bx-seg">
              <button
                type="button"
                className={draft.postSubmit === 'message' ? 'on' : ''}
                onClick={() => {
                  builder.setPostSubmit('message');
                }}
              >
                {t('settingsTab.postSubmitMessage')}
              </button>
              <button
                type="button"
                className={draft.postSubmit === 'redirect' ? 'on' : ''}
                onClick={() => {
                  builder.setPostSubmit('redirect');
                }}
              >
                {t('settingsTab.postSubmitRedirect')}
              </button>
            </div>
          </div>
          {draft.postSubmit === 'message' ? (
            <>
              <div className="srow">
                <label className="l" htmlFor="st-success-ja">
                  {enLocale ? t('settingsTab.successMessageJa') : t('settingsTab.successMessage')}
                </label>
                <textarea
                  id="st-success-ja"
                  className="sinput area"
                  value={draft.successMessage?.['ja'] ?? ''}
                  placeholder={t('settingsTab.successMessagePh')}
                  onChange={(e) => {
                    builder.setSuccessMessage('ja', e.target.value);
                  }}
                />
              </div>
              {enLocale ? (
                <div className="srow">
                  <label className="l" htmlFor="st-success-en">
                    {t('settingsTab.successMessageEn')}
                  </label>
                  <textarea
                    id="st-success-en"
                    className="sinput area"
                    value={draft.successMessage?.['en'] ?? ''}
                    placeholder="Thank you for reaching out."
                    onChange={(e) => {
                      builder.setSuccessMessage('en', e.target.value);
                    }}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="srow">
              <label className="l" htmlFor="st-redirect">
                {t('settingsTab.redirectUrl')}
              </label>
              <div style={{ flex: 1 }}>
                <input
                  id="st-redirect"
                  className="sinput"
                  type="url"
                  value={draft.redirectUrl ?? ''}
                  placeholder={t('settingsTab.redirectUrlPh')}
                  onChange={(e) => {
                    builder.setRedirectUrl(e.target.value);
                  }}
                />
                <p
                  className="td"
                  style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '6px 0 0' }}
                >
                  {t('settingsTab.redirectUrlHint')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="scard">
          <h4>
            <Icon name="shield" size={14} />
            {t('settingsTab.spamLang')}
          </h4>
          <div className="srow">
            <div className="stog">
              <div>
                <div className="tl">
                  {t('settingsTab.recaptcha')}
                  <SoonBadge />
                </div>
                <div className="td">{t('settingsTab.recaptchaDesc')}</div>
              </div>
              <Switch on={false} disabled label={t('settingsTab.recaptcha')} />
            </div>
          </div>
          <div className="srow">
            <div className="stog">
              <div>
                <div className="tl">
                  {t('settingsTab.dedupe')}
                  <SoonBadge />
                </div>
                <div className="td">{t('settingsTab.dedupeDesc')}</div>
              </div>
              <Switch on={false} disabled label={t('settingsTab.dedupe')} />
            </div>
          </div>
          <div className="srow">
            <label className="l" htmlFor="st-origins">
              {t('builder.allowedOrigins')}
            </label>
            <textarea
              id="st-origins"
              className="sinput area"
              value={draft.allowedOrigins.join('\n')}
              placeholder={t('settingsTab.allowedOriginsPh')}
              onChange={(e) => {
                builder.setAllowedOrigins(
                  e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter((s) => s !== ''),
                );
              }}
            />
            <p
              className="td"
              style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '2px 0 0' }}
            >
              {t('settingsTab.allowedOriginsHelp')}
            </p>
          </div>
          <div className="srow">
            <span className="l">{t('settingsTab.language')}</span>
            <div className="bx-seg">
              <button type="button" className="on" disabled>
                {t('settingsTab.ja')}
              </button>
              <button
                type="button"
                className={enLocale ? 'on' : ''}
                onClick={() => {
                  builder.toggleLocale('en');
                }}
              >
                {t('settingsTab.en')}
              </button>
            </div>
          </div>
        </div>

        <div className="scard">
          <h4>
            <Icon name="bell" size={14} />
            {t('settingsTab.notify')}
          </h4>
          <div className="srow">
            <div className="stog">
              <div>
                <div className="tl">
                  {t('settingsTab.autoReply')}
                  <SoonBadge />
                </div>
                <div className="td">{t('settingsTab.autoReplyDesc')}</div>
              </div>
              <Switch on={false} disabled label={t('settingsTab.autoReply')} />
            </div>
          </div>
          <p
            className="td"
            style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '2px 0 0' }}
          >
            {t('settingsTab.soon')}
          </p>

          <div className="srow">
            <label className="l" htmlFor="st-admin-subject">
              {t('settingsTab.adminSubject')}
            </label>
            <div style={{ flex: 1 }}>
              <input
                id="st-admin-subject"
                className="sinput"
                type="text"
                maxLength={255}
                value={draft.adminNotificationSubject ?? ''}
                placeholder={t('settingsTab.adminSubjectPh')}
                onChange={(e) => {
                  builder.setAdminNotificationSubject(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="srow">
            <label className="l" htmlFor="st-admin-body">
              {t('settingsTab.adminBody')}
            </label>
            <textarea
              id="st-admin-body"
              className="sinput area"
              maxLength={5000}
              value={draft.adminNotificationBody ?? ''}
              placeholder={t('settingsTab.adminBodyPh')}
              onChange={(e) => {
                builder.setAdminNotificationBody(e.target.value);
              }}
            />
          </div>
          <p
            className="td"
            style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '2px 0 0' }}
          >
            {t('settingsTab.adminVarsLabel')} {adminVarList}
          </p>
        </div>
      </div>
    </div>
  );
}
