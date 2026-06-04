import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type { NotificationChannelDto } from '@/entities/notification-channel/api-types';
import { toCreateChannelDto, toNotificationChannel } from '@/entities/notification-channel/mapper';
import type {
  NotificationChannel,
  NotificationChannelDraft,
} from '@/entities/notification-channel/model';
import { notificationChannelKeys } from '@/entities/notification-channel/query-keys';

export function useCreateNotificationChannelMutation(
  contactFormId: number,
): UseMutationResult<NotificationChannel, AppError, NotificationChannelDraft> {
  const queryClient = useQueryClient();
  return useMutation<NotificationChannel, AppError, NotificationChannelDraft>({
    mutationFn: async (draft) =>
      toNotificationChannel(
        await apiClient.post<NotificationChannelDto>(
          '/admin/notification-channels',
          toCreateChannelDto(draft),
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationChannelKeys.list(contactFormId) });
    },
  });
}
