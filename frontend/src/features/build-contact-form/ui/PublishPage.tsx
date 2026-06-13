import { useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import type { useFormBuilder } from '@/features/build-contact-form/hooks/use-form-builder';

type Builder = ReturnType<typeof useFormBuilder>;
type SnippetMode = 'chat' | 'modal' | 'inline';

// 連携・公開 tab — an independent page (builder IA spec §2): publish state, public URL, embed
// snippet, external integrations. The embed snippet + public key are wired; the publish-state
// toggle reflects the form's status, and the integration rows map to the existing notification
// channel types (managed in their own screen for now).
export function PublishPage({
  builder,
  isEditing,
}: {
  builder: Builder;
  isEditing: boolean;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;
  const [mode, setMode] = useState<SnippetMode>('modal');
  const [copied, setCopied] = useState(false);

  const origin = window.location.origin;
  const key = draft.publicFormKey.trim() === '' ? 'your-form-key' : draft.publicFormKey;
  const publicUrl = `${origin}/public/forms/${key}`;
  const snippet =
    `<script src="${origin}/embed.js" data-form="${key}"\n` +
    `        data-trigger="${mode}" async></script>`;

  const copy = (text: string): void => {
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      },
      () => {
        // Clipboard unavailable; nothing actionable.
      },
    );
  };

  const MODES: {
    v: SnippetMode;
    icon: IconName;
    labelKey: 'studio.mode.chat' | 'studio.mode.modal' | 'studio.mode.inline';
  }[] = [
    { v: 'chat', icon: 'chat', labelKey: 'studio.mode.chat' },
    { v: 'modal', icon: 'forms', labelKey: 'studio.mode.modal' },
    { v: 'inline', icon: 'code', labelKey: 'studio.mode.inline' },
  ];

  return (
    <div className="bd-sheetscroll">
      <div className="bd-sheet-page">
        <div className="sheet-head">
          <h3>{t('builder.tab2.publish')}</h3>
          <p>{t('publishTab.lead')}</p>
        </div>

        <div className="scard">
          <h4>
            <Icon name="globe" size={14} />
            {t('publishTab.state')}
          </h4>
          <div className="srow">
            <div className="stog">
              {isEditing ? (
                <span className="fm-st live">
                  <span className="d" />
                  {t('contactForms.status.active')}
                </span>
              ) : (
                <span className="fm-st draft">
                  <span className="d" />
                  {t('builder.statusDraft')}
                </span>
              )}
              <span
                className="td"
                style={{ marginLeft: 8, fontSize: '11.5px', color: 'var(--ex-faint)' }}
              >
                {isEditing ? t('publishTab.liveHint') : t('publishTab.draftHint')}
              </span>
            </div>
          </div>
        </div>

        <div className="scard">
          <h4>
            <Icon name="link" size={14} />
            {t('publishTab.url')}
          </h4>
          <div className="srow">
            <div className="sinput">
              <span className="pfx" style={{ color: 'var(--ex-text)' }}>
                {publicUrl}
              </span>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="miniout"
                onClick={() => {
                  copy(publicUrl);
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={14} />
                {t('publishTab.copy')}
              </button>
            </div>
          </div>
        </div>

        <div className="scard">
          <h4>
            <Icon name="code" size={14} />
            {t('publishTab.embed')}
          </h4>
          <div className="srow">
            <div className="bx-seg">
              {MODES.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  className={mode === m.v ? 'on' : ''}
                  onClick={() => {
                    setMode(m.v);
                  }}
                >
                  <Icon name={m.icon} size={14} />
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="srow">
            <pre className="pub-pre">{snippet}</pre>
          </div>
          <div className="srow">
            <button
              type="button"
              className="miniout"
              onClick={() => {
                copy(snippet);
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={14} />
              {t('publishTab.copyCode')}
            </button>
          </div>
        </div>

        <div className="scard">
          <h4>
            <Icon name="link" size={14} />
            {t('publishTab.integrations')}
          </h4>
          <div className="pub-int">
            <span className="pi-ic">
              <Icon name="link" size={19} />
            </span>
            <div className="pi-main">
              <div className="n">{t('publishTab.webhook')}</div>
              <div className="d">{t('publishTab.webhookDesc')}</div>
            </div>
            <span className="miniout">{t('publishTab.configure')}</span>
          </div>
          <div className="pub-int">
            <span className="pi-ic">
              <Icon name="slack" size={19} />
            </span>
            <div className="pi-main">
              <div className="n">{t('publishTab.slack')}</div>
              <div className="d">{t('publishTab.slackDesc')}</div>
            </div>
            <span className="miniout">{t('publishTab.connect')}</span>
          </div>
          <div className="pub-int">
            <span className="pi-ic">
              <Icon name="mail" size={19} />
            </span>
            <div className="pi-main">
              <div className="n">{t('publishTab.mail')}</div>
              <div className="d">{t('publishTab.mailDesc')}</div>
            </div>
            <span className="miniout">{t('publishTab.connect')}</span>
          </div>
          <p
            className="td"
            style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '10px 0 0' }}
          >
            {t('publishTab.intHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
