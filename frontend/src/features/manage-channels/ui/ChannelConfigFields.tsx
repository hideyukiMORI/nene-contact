import type { ReactNode } from 'react';
import type { ChannelType } from '@/entities/notification-channel';
import type { MessageKey } from '@/shared/i18n/messages/ja';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui';

interface FieldDef {
  key: string;
  inputType: string;
}

const CONFIG_FIELDS: Record<ChannelType, FieldDef[]> = {
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

// Per-type guidance shown above the inputs — this is where an operator learns, e.g., that the
// Chatwork room_id is digits only (the cause of the silent-fail bug).
const HELP_KEYS: Record<ChannelType, MessageKey[]> = {
  email: ['channels.help.email'],
  slack: ['channels.help.slack'],
  chatwork: ['channels.help.chatwork.room', 'channels.help.chatwork.token'],
  webhook: ['channels.help.webhook'],
};

interface Props {
  channelType: ChannelType;
  config: Record<string, string>;
  /** field key → i18n error key */
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  idPrefix: string;
  /** Edit mode: a blank secret keeps the stored value, so show a placeholder instead of "". */
  editing?: boolean;
}

export function ChannelConfigFields({
  channelType,
  config,
  errors,
  onChange,
  idPrefix,
  editing = false,
}: Props): ReactNode {
  const { t } = useI18n();

  return (
    <>
      <div className="ch-help">
        <Icon name="info" size={14} />
        <div>
          {HELP_KEYS[channelType].map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>
      </div>

      {CONFIG_FIELDS[channelType].map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const errorKey = errors[field.key];
        const isSecret = field.inputType === 'password';
        return (
          <div key={field.key} className="bd-frow">
            <label className="l" htmlFor={id}>
              {t(`channel.config.${field.key}` as MessageKey)}
            </label>
            <input
              id={id}
              type={field.inputType}
              value={config[field.key] ?? ''}
              placeholder={editing && isSecret ? t('channels.edit.secretPlaceholder') : undefined}
              aria-invalid={errorKey !== undefined ? true : undefined}
              onChange={(e) => {
                onChange(field.key, e.target.value);
              }}
            />
            {errorKey !== undefined ? (
              <span className="ch-fielderr" role="alert">
                {t(errorKey as MessageKey)}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
