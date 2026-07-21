import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { AppError } from '@/shared/api/errors';
import type {
  NotificationChannelDto,
  NotificationChannelTestResultDto,
} from '@/entities/notification-channel/api-types';
import {
  toCreateChannelDto,
  toNotificationChannel,
  toTestResult,
  toUpdateChannelDto,
} from '@/entities/notification-channel/mapper';
import type {
  NotificationChannel,
  NotificationChannelDraft,
  NotificationChannelTestResult,
  NotificationChannelUpdate,
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

export function useUpdateNotificationChannelMutation(
  contactFormId: number,
): UseMutationResult<
  NotificationChannel,
  AppError,
  { id: number; update: NotificationChannelUpdate }
> {
  const queryClient = useQueryClient();
  return useMutation<
    NotificationChannel,
    AppError,
    { id: number; update: NotificationChannelUpdate }
  >({
    mutationFn: async ({ id, update }) =>
      toNotificationChannel(
        await apiClient.patch<NotificationChannelDto>(
          `/admin/notification-channels/${String(id)}`,
          toUpdateChannelDto(update),
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationChannelKeys.list(contactFormId),
      });
    },
  });
}

export function useDeleteNotificationChannelMutation(
  contactFormId: number,
): UseMutationResult<unknown, AppError, number> {
  const queryClient = useQueryClient();
  return useMutation<unknown, AppError, number>({
    mutationFn: (id) => apiClient.delete(`/admin/notification-channels/${String(id)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationChannelKeys.list(contactFormId) });
    },
  });
}

export function useTestNotificationChannelMutation(): UseMutationResult<
  NotificationChannelTestResult,
  AppError,
  number
> {
  return useMutation<NotificationChannelTestResult, AppError, number>({
    mutationFn: async (id) =>
      toTestResult(
        await apiClient.post<NotificationChannelTestResultDto>(
          `/admin/notification-channels/${String(id)}/test`,
        ),
      ),
  });
}
