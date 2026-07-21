import type { ChannelType } from '@/entities/notification-channel/model';

// Mirrors the backend NeneContact\Notification\ChannelConfigValidator so the operator gets
// immediate, matching feedback. Keep the two in lockstep.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Trims every value and — for chatwork — strips a leading `rid` an operator pasted from the
 * room URL (`.../#!rid12345`), where only the digits are the real room id.
 */
export function normalizeChannelConfig(
  channelType: ChannelType,
  config: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    out[key] = value.trim();
  }
  if (channelType === 'chatwork' && out.room_id) {
    const match = /^rid(\d+)$/i.exec(out.room_id);
    if (match?.[1] !== undefined) {
      out.room_id = match[1];
    }
  }
  return out;
}

/**
 * Returns a map of config-field key → i18n error key. Empty when valid.
 *
 * `requireAll` = true on create (every required field must be present). On edit it is false:
 * a blank field means "keep the stored value" (secrets are never echoed back), so only
 * non-empty values are format-checked.
 */
export function validateChannelConfig(
  channelType: ChannelType,
  config: Record<string, string>,
  requireAll: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const value = (key: string): string => (config[key] ?? '').trim();

  const check = (key: string, isValid: (v: string) => boolean, errorKey: string): void => {
    const v = value(key);
    if (v === '') {
      if (requireAll) {
        errors[key] = errorKey;
      }
      return;
    }
    if (!isValid(v)) {
      errors[key] = errorKey;
    }
  };

  switch (channelType) {
    case 'email':
      check('recipient', (v) => EMAIL_RE.test(v), 'channels.invalid.recipient');
      break;
    case 'slack':
      check(
        'webhook_url',
        (v) => v.startsWith('https://hooks.slack.com/'),
        'channels.invalid.webhook_url',
      );
      break;
    case 'chatwork':
      check('api_token', () => true, 'channels.invalid.api_token');
      check('room_id', (v) => /^\d+$/.test(v), 'channels.invalid.room_id');
      break;
    case 'webhook':
      check('url', (v) => /^https?:\/\/.+/.test(v), 'channels.invalid.url');
      check('secret', () => true, 'channels.invalid.secret');
      break;
  }

  return errors;
}
