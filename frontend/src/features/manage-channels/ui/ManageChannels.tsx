import { useState, type ReactNode } from 'react';
import type { ChannelType } from '@/entities/notification-channel';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Alert, Button } from '@/shared/ui';
import { useChannels } from '@/features/manage-channels/hooks/use-channels';

const CHANNEL_TYPES: ChannelType[] = ['email', 'slack', 'chatwork', 'webhook'];

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
    <div className="nc-section">
      {isLoading ? <p>{t('common.loading')}</p> : null}
      {error !== null ? <Alert>{t('channels.error')}</Alert> : null}
      {!isLoading && error === null && channels.length === 0 ? (
        <p className="nc-muted">{t('channels.empty')}</p>
      ) : null}
      {channels.length > 0 ? (
        <table className="nc-table">
          <thead>
            <tr>
              <th>{t('channels.column.type')}</th>
              <th>{t('channels.column.enabled')}</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td>{t(`channel.type.${channel.channelType}`)}</td>
                <td>{channel.isEnabled ? t('channels.enabled.yes') : t('channels.enabled.no')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <fieldset className="nc-fieldset">
        <legend>{t('channels.add')}</legend>
        <div className="nc-field">
          <label className="nc-label" htmlFor="nc-channel-type">
            {t('channels.type')}
          </label>
          <select
            id="nc-channel-type"
            className="nc-input"
            value={channelType}
            onChange={(e) => {
              setChannelType(e.target.value as ChannelType);
              setConfig({});
            }}
          >
            {CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`channel.type.${type}`)}
              </option>
            ))}
          </select>
        </div>

        {CONFIG_FIELDS[channelType].map((field) => {
          const id = `nc-cfg-${field.key}`;
          return (
            <div key={field.key} className="nc-field">
              <label className="nc-label" htmlFor={id}>
                {t(`channel.config.${field.key}` as MessageKey)}
              </label>
              <input
                id={id}
                className="nc-input"
                type={field.inputType}
                value={config[field.key] ?? ''}
                onChange={(e) => {
                  setConfig((c) => ({ ...c, [field.key]: e.target.value }));
                }}
              />
            </div>
          );
        })}

        {createError !== null ? <Alert>{t('channels.createError')}</Alert> : null}
        <Button type="button" disabled={isCreating} onClick={onCreate}>
          {isCreating ? t('channels.creating') : t('channels.create')}
        </Button>
      </fieldset>
    </div>
  );
}
