import type { components } from '@/shared/api/schema.gen';

export type NotificationChannelDto = components['schemas']['NotificationChannelResponse'];
export type NotificationChannelListDto = components['schemas']['NotificationChannelListResponse'];
export type CreateNotificationChannelDto =
  components['schemas']['CreateNotificationChannelRequest'];
export type UpdateNotificationChannelDto =
  components['schemas']['UpdateNotificationChannelRequest'];
export type NotificationChannelTestResultDto =
  components['schemas']['NotificationChannelTestResult'];
