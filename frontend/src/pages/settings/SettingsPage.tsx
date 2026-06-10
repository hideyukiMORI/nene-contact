import { useState, type ReactNode } from 'react';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';

// The settings screen is a Pro Console design preview: the layout is faithful but the
// controls are not wired to a backend (no such API yet). Toggles/segments keep local
// cosmetic state; inputs are placeholders. A note makes the preview nature explicit.

type Tab = 'general' | 'notify' | 'brand' | 'integrations';

const NAV: { key: Tab; icon: IconName; labelKey: MessageKey }[] = [
  { key: 'general', icon: 'settings', labelKey: 'settings.nav.general' },
  { key: 'notify', icon: 'bell', labelKey: 'settings.nav.notify' },
  { key: 'brand', icon: 'sparkle', labelKey: 'settings.nav.brand' },
  { key: 'integrations', icon: 'link', labelKey: 'settings.nav.integrations' },
];

function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}): ReactNode {
  return (
    <button
      type="button"
      className={'bd-switch' + (on ? '' : ' off')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

export function SettingsPage(): ReactNode {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('general');
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    onNew: true,
    daily: false,
    autoReply: true,
    logo: false,
  });
  const [accent, setAccent] = useState(0);
  const [shape, setShape] = useState(1);

  const toggle = (key: string): void => {
    setSwitches((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="se-wrap">
      <nav className="se-nav">
        <div className="gh">{t('settings.title')}</div>
        {NAV.map((it) => (
          <button
            key={it.key}
            type="button"
            className={'se-snav' + (tab === it.key ? ' on' : '')}
            onClick={() => {
              setTab(it.key);
            }}
          >
            <Icon name={it.icon} size={16} />
            {t(it.labelKey)}
          </button>
        ))}
      </nav>

      <div className="se-content">
        <h1 className="se-h1">{t(NAV.find((n) => n.key === tab)?.labelKey ?? 'settings.title')}</h1>
        <p className="se-lead">{t(`settings.${tab}.lead`)}</p>
        <div className="se-demo">{t('settings.demoNote')}</div>

        {tab === 'general' ? (
          <div className="se-card">
            <div className="se-card-h">
              <Icon name="settings" size={15} />
              {t('settings.general.workspace')}
            </div>
            <Row label={t('settings.general.orgName')}>
              <input className="se-inp" placeholder={t('settings.general.orgName')} />
            </Row>
            <Row label={t('settings.general.url')}>
              <input className="se-inp" placeholder={t('settings.general.url')} />
            </Row>
            <Row label={t('settings.general.defaultLang')}>
              <input className="se-inp" placeholder={t('settings.general.defaultLang')} />
            </Row>
            <Row label={t('settings.general.timezone')}>
              <input className="se-inp" placeholder={t('settings.general.timezone')} />
            </Row>
          </div>
        ) : null}

        {tab === 'notify' ? (
          <>
            <div className="se-card">
              <div className="se-card-h">
                <Icon name="bell" size={15} />
                {t('settings.notify.dest')}
              </div>
              <div className="se-fullrow">
                <div className="t">{t('settings.notify.destEmails')}</div>
                <div className="se-chips">
                  <button type="button" className="se-addchip">
                    <Icon name="plus" size={13} />
                    {t('settings.notify.add')}
                  </button>
                </div>
              </div>
              <Row label={t('settings.notify.onNew')} desc={t('settings.notify.onNewDesc')}>
                <Switch
                  on={switches.onNew ?? false}
                  onToggle={() => {
                    toggle('onNew');
                  }}
                  label={t('settings.notify.onNew')}
                />
              </Row>
              <Row label={t('settings.notify.daily')} desc={t('settings.notify.dailyDesc')}>
                <Switch
                  on={switches.daily ?? false}
                  onToggle={() => {
                    toggle('daily');
                  }}
                  label={t('settings.notify.daily')}
                />
              </Row>
            </div>
            <div className="se-card">
              <div className="se-card-h">
                <Icon name="send" size={15} />
                {t('settings.notify.autoReply')}
              </div>
              <Row
                label={t('settings.notify.autoReplyOn')}
                desc={t('settings.notify.autoReplyDesc')}
              >
                <Switch
                  on={switches.autoReply ?? false}
                  onToggle={() => {
                    toggle('autoReply');
                  }}
                  label={t('settings.notify.autoReplyOn')}
                />
              </Row>
              <Row label={t('settings.notify.fromName')}>
                <input className="se-inp" placeholder={t('settings.notify.fromName')} />
              </Row>
            </div>
          </>
        ) : null}

        {tab === 'brand' ? (
          <div className="se-card">
            <div className="se-card-h">
              <Icon name="sparkle" size={15} />
              {t('settings.brand.appearance')}
            </div>
            <div className="se-fullrow">
              <div className="t">{t('settings.brand.accent')}</div>
              <div className="se-swatches">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`se-sw s${String(i + 1)}` + (accent === i ? ' on' : '')}
                    aria-label={t('settings.brand.accent')}
                    onClick={() => {
                      setAccent(i);
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="se-fullrow">
              <div className="t">{t('settings.brand.btnShape')}</div>
              <div className="se-seg">
                {[
                  t('settings.brand.shapeSquare'),
                  t('settings.brand.shapeRound'),
                  t('settings.brand.shapePill'),
                ].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={'o' + (shape === i ? ' on' : '')}
                    onClick={() => {
                      setShape(i);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Row label={t('settings.brand.submitLabel')}>
              <input className="se-inp" placeholder={t('settings.brand.submitLabel')} />
            </Row>
            <Row label={t('settings.brand.logo')} desc={t('settings.brand.logoDesc')}>
              <Switch
                on={switches.logo ?? false}
                onToggle={() => {
                  toggle('logo');
                }}
                label={t('settings.brand.logo')}
              />
            </Row>
          </div>
        ) : null}

        {tab === 'integrations' ? (
          <div className="se-card">
            <Integration icon="slack" name="Slack" desc={t('settings.integrations.slackDesc')}>
              <span className="se-conn">{t('settings.integrations.connected')}</span>
            </Integration>
            <Integration icon="globe" name="Webhook" desc={t('settings.integrations.webhookDesc')}>
              <span className="ex-btn ghost">{t('settings.integrations.configure')}</span>
            </Integration>
            <Integration
              icon="file"
              name={t('settings.integrations.sheetsName')}
              desc={t('settings.integrations.sheetsDesc')}
            >
              <span className="ex-btn ghost">{t('settings.integrations.connect')}</span>
            </Integration>
            <Integration icon="link" name="Zapier" desc={t('settings.integrations.zapierDesc')}>
              <span className="ex-btn ghost">{t('settings.integrations.connect')}</span>
            </Integration>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="se-row">
      <div className="info">
        <div className="t">{label}</div>
        {desc !== undefined ? <div className="d">{desc}</div> : null}
      </div>
      <div className="ctl">{children}</div>
    </div>
  );
}

function Integration({
  icon,
  name,
  desc,
  children,
}: {
  icon: IconName;
  name: string;
  desc: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="se-intg">
      <span className="ic">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div className="nm">{name}</div>
        <div className="ds">{desc}</div>
      </div>
      <div className="ctl">{children}</div>
    </div>
  );
}
