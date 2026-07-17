import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { useNotificationChannelsQuery, CHANNEL_ICON } from '@/entities/notification-channel';
import { env } from '@/shared/config/env';
import { resolvePublicBase } from '@/features/build-contact-form/lib/public-base';
import {
  buildEmbedSnippet,
  fetchEmbedManifest,
} from '@/features/build-contact-form/lib/embed-snippet';
import type { useFormBuilder } from '@/features/build-contact-form/model/use-form-builder';

type Builder = ReturnType<typeof useFormBuilder>;
type SnippetMode = 'chat' | 'modal' | 'inline';

// 連携・公開 tab — an independent page (builder IA spec §2): publish state, public URL, embed
// snippet, notification channels. The embed snippet + public key are wired; the publish-state
// toggle reflects the form's status; the notifications card shows the form's live channels and
// links to the dedicated channels screen for add/edit (a new, unsaved form has no id yet).
export function PublishPage({
  builder,
  isEditing,
  formId,
}: {
  builder: Builder;
  isEditing: boolean;
  formId: number | undefined;
}): ReactNode {
  const { t } = useI18n();
  const { draft } = builder;
  const [mode, setMode] = useState<SnippetMode>('modal');
  const [copied, setCopied] = useState(false);

  const base = resolvePublicBase(env.publicBaseUrl, window.location.origin);
  const key = draft.publicFormKey.trim() === '' ? 'your-form-key' : draft.publicFormKey;
  const publicUrl = `${base}/public/forms/${key}`;
  // Prefer the production build (hashed filename + SRI) when its manifest is reachable; fall back
  // to the plain /embed.js otherwise (dev, or before `npm run build:embed`). #334.
  const manifestQuery = useQuery({
    queryKey: ['embed-manifest', base],
    queryFn: () => fetchEmbedManifest(base),
    retry: false,
    staleTime: Infinity,
  });
  const snippet = buildEmbedSnippet(base, key, mode, manifestQuery.data ?? null);

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
            <Icon name="bell" size={14} />
            {t('publishTab.integrations')}
          </h4>
          <p
            className="td"
            style={{ fontSize: '11.5px', color: 'var(--ex-faint)', margin: '-2px 0 10px' }}
          >
            {t('publishTab.intLead')}
          </p>
          {formId === undefined ? (
            <p className="td" style={{ fontSize: '12px', color: 'var(--ex-faint)' }}>
              {t('publishTab.intUnsaved')}
            </p>
          ) : (
            <BuilderChannels contactFormId={formId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Live notification-channel summary for a saved form. Read-only here — add/edit happens on the
// dedicated channels screen (the create endpoint needs a saved contact_form_id and exposes no
// config back, so editing belongs on the full screen). Reuses the entity query + icon map.
function BuilderChannels({ contactFormId }: { contactFormId: number }): ReactNode {
  const { t } = useI18n();
  const navigate = useNavigate();
  const query = useNotificationChannelsQuery(contactFormId);
  const channels = query.data ?? [];

  return (
    <>
      {query.isPending ? (
        <p className="td" style={{ fontSize: '12px', color: 'var(--ex-faint)' }}>
          {t('common.loading')}
        </p>
      ) : channels.length === 0 ? (
        <p className="td" style={{ fontSize: '12px', color: 'var(--ex-faint)' }}>
          {t('publishTab.intEmpty')}
        </p>
      ) : (
        channels.map((channel) => (
          <div className="pub-int" key={channel.id}>
            <span className="pi-ic">
              <Icon name={CHANNEL_ICON[channel.channelType]} size={19} />
            </span>
            <div className="pi-main">
              <div className="n">{t(`channel.type.${channel.channelType}`)}</div>
            </div>
            <span className={channel.isEnabled ? 'ex-badge done' : 'fm-st ended'}>
              <span className={channel.isEnabled ? 'dot' : 'd'} />
              {channel.isEnabled ? t('publishTab.channelOn') : t('publishTab.channelOff')}
            </span>
          </div>
        ))
      )}
      <button
        type="button"
        className="miniout"
        style={{ marginTop: 10 }}
        onClick={() => {
          void navigate(`/contact-forms/${String(contactFormId)}/channels`);
        }}
      >
        <Icon name="settings" size={14} />
        {t('publishTab.manageChannels')}
      </button>
    </>
  );
}
