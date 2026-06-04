import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { NotificationChannelListDto } from '@/entities/notification-channel/api-types';
import { toNotificationChannels } from '@/entities/notification-channel/mapper';
import type { NotificationChannel } from '@/entities/notification-channel/model';
import { notificationChannelKeys } from '@/entities/notification-channel/query-keys';

export function useNotificationChannelsQuery(
  contactFormId: number,
): UseQueryResult<NotificationChannel[], AppError> {
  return useQuery<NotificationChannel[], AppError>({
    queryKey: notificationChannelKeys.list(contactFormId),
    queryFn: async () =>
      toNotificationChannels(
        await apiClient.get<NotificationChannelListDto>(
          `/admin/notification-channels?contact_form_id=${String(contactFormId)}`,
        ),
      ),
  });
}
