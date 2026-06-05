import { useState, type ReactNode } from 'react';
import type { ChannelType } from '@/entities/notification-channel';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Alert } from '@/shared/ui';
import { useChannels } from '@/features/manage-channels/hooks/use-channels';
import { ChannelIcon } from '@/features/manage-channels/ui/icons';
import type { ChannelIconName } from '@/features/manage-channels/ui/icons';

const CHANNEL_TYPES: ChannelType[] = ['email', 'slack', 'chatwork', 'webhook'];

const TYPE_ICON: Record<ChannelType, ChannelIconName> = {
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
    <div className="ch-page">
      <div className="card">
        <div className="card-head">
          <span className="card-ico">
            <ChannelIcon name="bell" size={16} />
          </span>
          <h3>{t('channels.configured')}</h3>
        </div>

        {isLoading ? (
          <div className="card-pad">
            <p className="faint">{t('common.loading')}</p>
          </div>
        ) : error !== null ? (
          <div className="card-pad">
            <Alert>{t('channels.error')}</Alert>
          </div>
        ) : channels.length === 0 ? (
          <div className="card-pad">
            <p className="faint">{t('channels.empty')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
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
                        <ChannelIcon name={TYPE_ICON[channel.channelType]} size={16} />
                        {t(`channel.type.${channel.channelType}`)}
                      </span>
                    </td>
                    <td>
                      {channel.isEnabled ? (
                        <span className="badge resolved">
                          <span className="dot" />
                          {t('channels.on')}
                        </span>
                      ) : (
                        <span className="chip">{t('channels.off')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card card-pad add-channel">
        <h3 className="add-channel-title">{t('channels.add')}</h3>

        <div className="field">
          <span className="label">{t('channels.type')}</span>
          <div className="segmented full">
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
                <ChannelIcon name={TYPE_ICON[type]} size={15} />
                {t(`channel.type.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {CONFIG_FIELDS[channelType].map((fieldDef) => {
          const id = `ch-cfg-${fieldDef.key}`;
          return (
            <div key={fieldDef.key} className="field">
              <label className="label" htmlFor={id}>
                {t(`channel.config.${fieldDef.key}` as MessageKey)}
              </label>
              <input
                id={id}
                className="input"
                type={fieldDef.inputType}
                value={config[fieldDef.key] ?? ''}
                onChange={(e) => {
                  setConfig((c) => ({ ...c, [fieldDef.key]: e.target.value }));
                }}
              />
            </div>
          );
        })}

        {createError !== null ? <Alert>{t('channels.createError')}</Alert> : null}

        <button
          type="button"
          className="btn btn-primary add-channel-submit"
          disabled={isCreating}
          onClick={onCreate}
        >
          <ChannelIcon name="plus" size={16} />
          {isCreating ? t('channels.creating') : t('channels.create')}
        </button>
      </div>
    </div>
  );
}
