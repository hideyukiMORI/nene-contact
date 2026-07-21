import type {
  CreateNotificationChannelDto,
  NotificationChannelDto,
  NotificationChannelListDto,
  NotificationChannelTestResultDto,
  UpdateNotificationChannelDto,
} from '@/entities/notification-channel/api-types';
import type {
  NotificationChannel,
  NotificationChannelDraft,
  NotificationChannelTestResult,
  NotificationChannelUpdate,
} from '@/entities/notification-channel/model';

export function toNotificationChannel(dto: NotificationChannelDto): NotificationChannel {
  return {
    id: dto.id,
    contactFormId: dto.contact_form_id,
    channelType: dto.channel_type,
    isEnabled: dto.is_enabled ?? true,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
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

export function toUpdateChannelDto(
  update: NotificationChannelUpdate,
): UpdateNotificationChannelDto {
  return {
    ...(update.config !== undefined ? { config: update.config } : {}),
    ...(update.isEnabled !== undefined ? { is_enabled: update.isEnabled } : {}),
  };
}

export function toTestResult(dto: NotificationChannelTestResultDto): NotificationChannelTestResult {
  return { ok: dto.ok, error: dto.error ?? null };
}
