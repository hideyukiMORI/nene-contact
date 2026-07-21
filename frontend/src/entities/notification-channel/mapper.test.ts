import { describe, expect, it } from 'vitest';
import {
  toCreateChannelDto,
  toNotificationChannel,
  toNotificationChannels,
} from '@/entities/notification-channel/mapper';

describe('notification-channel mappers', () => {
  it('maps a channel DTO (no config returned — secrets redacted)', () => {
    expect(
      toNotificationChannel({
        id: 1,
        contact_form_id: 3,
        channel_type: 'slack',
        is_enabled: true,
        created_at: '2026-07-21 00:00:00',
        updated_at: '2026-07-21 01:00:00',
      }),
    ).toEqual({
      id: 1,
      contactFormId: 3,
      channelType: 'slack',
      isEnabled: true,
      createdAt: '2026-07-21 00:00:00',
      updatedAt: '2026-07-21 01:00:00',
    });
  });

  it('maps an empty list', () => {
    expect(toNotificationChannels({ items: [] })).toEqual([]);
  });

  it('maps a draft to the create request', () => {
    expect(
      toCreateChannelDto({
        contactFormId: 3,
        channelType: 'webhook',
        config: { url: 'https://h/x', secret: 's' },
        isEnabled: true,
      }),
    ).toEqual({
      contact_form_id: 3,
      channel_type: 'webhook',
      config: { url: 'https://h/x', secret: 's' },
      is_enabled: true,
    });
  });
});
