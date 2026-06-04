import type {
  CreateNotificationChannelDto,
  NotificationChannelDto,
  NotificationChannelListDto,
} from '@/entities/notification-channel/api-types';
import type {
  NotificationChannel,
  NotificationChannelDraft,
} from '@/entities/notification-channel/model';

export function toNotificationChannel(dto: NotificationChannelDto): NotificationChannel {
  return {
    id: dto.id,
    contactFormId: dto.contact_form_id,
    channelType: dto.channel_type,
    isEnabled: dto.is_enabled ?? true,
  };
}

export function toNotificationChannels(dto: NotificationChannelListDto): NotificationChannel[] {
  return (dto.items ?? []).map(toNotificationChannel);
}

export function toCreateChannelDto(draft: NotificationChannelDraft): CreateNotificationChannelDto {
  return {
    contact_form_id: draft.contactFormId,
    channel_type: draft.channelType,
    config: draft.config,
    is_enabled: draft.isEnabled,
  };
}
