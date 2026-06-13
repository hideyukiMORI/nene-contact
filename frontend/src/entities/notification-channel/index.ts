export { useNotificationChannelsQuery } from '@/entities/notification-channel/queries';
export { useCreateNotificationChannelMutation } from '@/entities/notification-channel/mutations';
export {
  toNotificationChannel,
  toNotificationChannels,
  toCreateChannelDto,
} from '@/entities/notification-channel/mapper';
export { notificationChannelKeys } from '@/entities/notification-channel/query-keys';
export { CHANNEL_TYPES, CHANNEL_ICON } from '@/entities/notification-channel/meta';
export type {
  ChannelType,
  NotificationChannel,
  NotificationChannelDraft,
} from '@/entities/notification-channel/model';
