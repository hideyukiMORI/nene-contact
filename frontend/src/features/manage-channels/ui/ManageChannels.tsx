import { useState, type ReactNode } from 'react';
import type { ChannelType } from '@/entities/notification-channel';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { useChannels } from '@/features/manage-channels/hooks/use-channels';

const CHANNEL_TYPES: ChannelType[] = ['email', 'slack', 'chatwork', 'webhook'];

const TYPE_ICON: Record<ChannelType, IconName> = {
  email: 'mail',
  slack: 'slack',
  chatwork: 'chat',
  webhook: 'code',
};

const CONFIG_FIELDS: Record<ChannelType, { key: string; inputType: string }[]> = {
  email: [{ key: 'recipient', inputType: 'email' }],
  slack: [{ key: 'webhook_url', inputType: 'url' }],
  chatwork: [
    { key: 'api_token', inputType: 'password' },
    { key: 'room_id', inputType: 'text' },
  ],
  webhook: [
    { key: 'url', inputType: 'url' },
    { key: 'secret', inputType: 'password' },
  ],
};

export function ManageChannels({ contactFormId }: { contactFormId: number }): ReactNode {
  const { t } = useI18n();
  const { channels, isLoading, error, create, isCreating, createError } =
    useChannels(contactFormId);
  const [channelType, setChannelType] = useState<ChannelType>('email');
  const [config, setConfig] = useState<Record<string, string>>({});

  const onCreate = (): void => {
    void create({ contactFormId, channelType, config, isEnabled: true }).then(() => {
      setConfig({});
    });
  };

  return (
    <div className="ch-grid">
      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="bell" size={15} />
          <h3>{t('channels.configured')}</h3>
        </div>

        {isLoading ? (
          <div className="fm-state">{t('common.loading')}</div>
        ) : error !== null ? (
          <div className="fm-state">
            <div className="au-note" role="alert">
              {t('channels.error')}
            </div>
          </div>
        ) : channels.length === 0 ? (
          <div className="fm-state">{t('channels.empty')}</div>
        ) : (
          <div className="tbl-wrap">
            <table className="fm-tbl">
              <thead>
                <tr>
                  <th>{t('channels.column.type')}</th>
                  <th>{t('channels.column.enabled')}</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id}>
                    <td>
                      <span className="ch-type">
                        <Icon name={TYPE_ICON[channel.channelType]} size={16} />
                        {t(`channel.type.${channel.channelType}`)}
                      </span>
                    </td>
                    <td>
                      {channel.isEnabled ? (
                        <span className="ex-badge done">
                          <span className="dot" />
                          {t('channels.on')}
                        </span>
                      ) : (
                        <span className="fm-st ended">
                          <span className="d" />
                          {t('channels.off')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fm-card">
        <div className="ex-cardhead">
          <Icon name="plus" size={15} />
          <h3>{t('channels.add')}</h3>
        </div>
        <div className="ex-card-pad">
          <div className="bd-frow">
            <span className="l">{t('channels.type')}</span>
            <div className="ch-seg">
              {CHANNEL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={channelType === type ? 'on' : ''}
                  onClick={() => {
                    setChannelType(type);
                    setConfig({});
                  }}
                >
                  <Icon name={TYPE_ICON[type]} size={15} />
                  {t(`channel.type.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {CONFIG_FIELDS[channelType].map((fieldDef) => {
            const id = `ch-cfg-${fieldDef.key}`;
            return (
              <div key={fieldDef.key} className="bd-frow">
                <label className="l" htmlFor={id}>
                  {t(`channel.config.${fieldDef.key}` as MessageKey)}
                </label>
                <input
                  id={id}
                  type={fieldDef.inputType}
                  value={config[fieldDef.key] ?? ''}
                  onChange={(e) => {
                    setConfig((c) => ({ ...c, [fieldDef.key]: e.target.value }));
                  }}
                />
              </div>
            );
          })}

          {createError !== null ? (
            <div className="au-note" role="alert">
              {t('channels.createError')}
            </div>
          ) : null}

          <button type="button" className="ex-btn" disabled={isCreating} onClick={onCreate}>
            <Icon name="plus" size={14} />
            {isCreating ? t('channels.creating') : t('channels.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
