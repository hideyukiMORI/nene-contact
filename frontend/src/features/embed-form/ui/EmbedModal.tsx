import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import { Modal } from '@/shared/ui';
import { env } from '@/shared/config/env';
import type { ContactForm } from '@/entities/contact-form';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { EmbedIcon } from '@/features/embed-form/ui/icons';
import type { EmbedIconName } from '@/features/embed-form/ui/icons';

type Trigger = 'floating' | 'button' | 'inline';

interface TriggerOption {
  value: Trigger;
  icon: EmbedIconName;
  labelKey: MessageKey;
  descKey: MessageKey;
}

const TRIGGERS: TriggerOption[] = [
  {
    value: 'floating',
    icon: 'chat',
    labelKey: 'embed.trigger.floating',
    descKey: 'embed.trigger.floatingDesc',
  },
  {
    value: 'button',
    icon: 'send',
    labelKey: 'embed.trigger.button',
    descKey: 'embed.trigger.buttonDesc',
  },
  {
    value: 'inline',
    icon: 'forms',
    labelKey: 'embed.trigger.inline',
    descKey: 'embed.trigger.inlineDesc',
  },
];

// The embed widget is served from the Contact host the console talks to.
function embedOrigin(): string {
  try {
    return new URL(env.apiBaseUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function localeLabel(locale: string): string {
  if (locale === 'ja') return '日本語 (ja)';
  if (locale === 'en') return 'English (en)';
  return locale;
}

function CopyButton({
  text,
  className,
  label,
  iconOnly = false,
}: {
  text: string;
  className: string;
  label?: string;
  iconOnly?: boolean;
}): ReactNode {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  const onCopy = (): void => {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setDone(true);
        window.setTimeout(() => {
          setDone(false);
        }, 1600);
      })
      .catch(() => {
        // Clipboard unavailable or denied; nothing actionable to surface here.
      });
  };

  return (
    <button type="button" className={className} onClick={onCopy}>
      <EmbedIcon name={done ? 'check' : 'copy'} size={iconOnly ? 14 : 16} />
      {iconOnly ? null : done ? t('embed.copied') : label}
    </button>
  );
}

export function EmbedModal({
  form,
  onClose,
}: {
  form: ContactForm;
  onClose: () => void;
}): ReactNode {
  const { t } = useI18n();
  const host = embedOrigin();
  const locales = form.locales.length > 0 ? form.locales : [form.defaultLocale || 'ja'];

  const [trigger, setTrigger] = useState<Trigger>('floating');
  const [lang, setLang] = useState(
    locales.includes(form.defaultLocale) ? form.defaultLocale : (locales[0] ?? 'ja'),
  );
  const [buttonLabel, setButtonLabel] = useState(t('embed.defaultButtonLabel'));

  const attrs = [
    `data-form="${form.publicFormKey}"`,
    `data-trigger="${trigger}"`,
    trigger === 'button' && buttonLabel.length > 0 ? `data-button-label="${buttonLabel}"` : null,
    `data-lang="${lang}"`,
  ].filter((a): a is string => a !== null);

  const code = `<script src="${host}/embed.js"\n        ${attrs.join(' ')} async></script>`;
  const demoUrl = `${host}/embed-demo.html?form=${encodeURIComponent(form.publicFormKey)}`;
  const current = TRIGGERS.find((option) => option.value === trigger);

  return (
    <Modal
      wide
      title={t('embed.title')}
      icon={<EmbedIcon name="code" size={18} />}
      onClose={onClose}
      foot={
        <>
          <a className="btn" href={demoUrl} target="_blank" rel="noreferrer">
            <EmbedIcon name="external" size={16} />
            {t('embed.tryDemo')}
          </a>
          <CopyButton text={code} className="btn btn-primary" label={t('embed.copyCode')} />
        </>
      }
    >
      <div className="notice info">
        <EmbedIcon name="bulb" size={18} className="n-ico" />
        <div>{t('embed.intro')}</div>
      </div>

      <div className="embed-grid">
        <div>
          <div className="field">
            <span className="label">{t('embed.step1')}</span>
            <div className="embed-triggers">
              {TRIGGERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={trigger === option.value ? 'trigger-card selected' : 'trigger-card'}
                  onClick={() => {
                    setTrigger(option.value);
                  }}
                >
                  <span className="trigger-ico">
                    <EmbedIcon name={option.icon} size={17} />
                  </span>
                  <span className="tc-body">
                    <span className="tc-title">{t(option.labelKey)}</span>
                    <span className="tc-desc">{t(option.descKey)}</span>
                  </span>
                  {trigger === option.value ? (
                    <span className="tc-check">
                      <EmbedIcon name="check" size={18} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="row-2 embed-row">
            <div className="field">
              <span className="label">{t('embed.step2')}</span>
              <select
                className="select"
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                }}
              >
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {localeLabel(locale)}
                  </option>
                ))}
              </select>
            </div>
            {trigger === 'button' ? (
              <div className="field">
                <span className="label">{t('embed.buttonLabel')}</span>
                <input
                  className="input"
                  value={buttonLabel}
                  onChange={(e) => {
                    setButtonLabel(e.target.value);
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="field embed-row">
            <span className="label">{t('embed.step3')}</span>
            <div className="code-block">
              <div className="copy-fab">
                <CopyButton text={code} className="btn btn-sm" iconOnly />
              </div>
              <span className="tok-tag">&lt;script</span> <span className="tok-attr">src</span>=
              <span className="tok-str">&quot;{host}/embed.js&quot;</span>
              {'\n        '}
              {attrs.map((attr) => {
                const eq = attr.indexOf('=');
                return (
                  <Fragment key={attr.slice(0, eq)}>
                    <span className="tok-attr">{attr.slice(0, eq)}</span>=
                    <span className="tok-str">{attr.slice(eq + 1)}</span>{' '}
                  </Fragment>
                );
              })}
              <span className="tok-attr">async</span>
              <span className="tok-tag">&gt;&lt;/script&gt;</span>
            </div>
          </div>

          <div className="notice tip-note embed-row">
            <EmbedIcon name="shield" size={18} className="n-ico" />
            <div>{t('embed.httpsNote')}</div>
          </div>
        </div>

        <div>
          <span className="label">{t('embed.preview')}</span>
          <div className="embed-preview">
            <div className="epv-bar">
              <span className="epv-dot epv-dot-r" />
              <span className="epv-dot epv-dot-y" />
              <span className="epv-dot epv-dot-g" />
              <span className="epv-host">your-site.example</span>
            </div>
            <div className="epv-canvas">
              <div className="epv-line lg" />
              <div className="epv-line l2" />
              <div className="epv-line l3" />

              {trigger === 'floating' ? (
                <div className="epv-bubble">
                  <EmbedIcon name="chat" size={15} />
                  {t('embed.previewContact')}
                </div>
              ) : null}
              {trigger === 'button' ? (
                <div className="epv-btn">
                  <EmbedIcon name="send" size={14} />
                  {buttonLabel.length > 0 ? buttonLabel : t('embed.previewContact')}
                </div>
              ) : null}
              {trigger === 'inline' ? (
                <div className="epv-form">
                  <div className="epv-ftitle">{t('embed.previewTitle')}</div>
                  <div className="epv-fld" />
                  <div className="epv-fld" />
                  <div className="epv-fld tall" />
                  <span className="epv-send">{t('embed.previewSend')}</span>
                </div>
              ) : null}
            </div>
          </div>
          {current !== undefined ? (
            <p className="hint embed-row-sm">{t('embed.shownAs', { name: t(current.labelKey) })}</p>
          ) : null}

          <div className="card embed-keycard">
            <div className="ek-title">{t('embed.publicKeyUsed')}</div>
            <div className="embed-keyrow">
              <code className="pill-key">{form.publicFormKey}</code>
              <CopyButton text={form.publicFormKey} className="btn btn-sm" iconOnly />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
