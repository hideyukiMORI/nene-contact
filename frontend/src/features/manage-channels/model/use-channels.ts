import {
  useCreateNotificationChannelMutation,
  useDeleteNotificationChannelMutation,
  useNotificationChannelsQuery,
  useTestNotificationChannelMutation,
  useUpdateNotificationChannelMutation,
} from '@/entities/notification-channel';
import type { AppError } from '@/shared/api/errors';
import type {
  NotificationChannel,
  NotificationChannelDraft,
  NotificationChannelTestResult,
  NotificationChannelUpdate,
} from '@/entities/notification-channel';

interface UseChannels {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: AppError | null;
  create: (draft: NotificationChannelDraft) => Promise<NotificationChannel>;
  isCreating: boolean;
  createError: AppError | null;
  update: (args: { id: number; update: NotificationChannelUpdate }) => Promise<NotificationChannel>;
  isUpdating: boolean;
  updateError: AppError | null;
  remove: (id: number) => Promise<unknown>;
  isRemoving: boolean;
  test: (id: number) => Promise<NotificationChannelTestResult>;
  isTesting: boolean;
}

export function useChannels(contactFormId: number): UseChannels {
  const query = useNotificationChannelsQuery(contactFormId);
  const create = useCreateNotificationChannelMutation(contactFormId);
  const update = useUpdateNotificationChannelMutation(contactFormId);
  const remove = useDeleteNotificationChannelMutation(contactFormId);
  const test = useTestNotificationChannelMutation();

  return {
    channels: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    create: create.mutateAsync,
    isCreating: create.isPending,
    createError: create.error,
    update: update.mutateAsync,
    isUpdating: update.isPending,
    updateError: update.error,
    remove: remove.mutateAsync,
    isRemoving: remove.isPending,
    test: test.mutateAsync,
    isTesting: test.isPending,
  };
}
