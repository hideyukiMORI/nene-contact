import {
  useCreateNotificationChannelMutation,
  useNotificationChannelsQuery,
} from '@/entities/notification-channel';
import type { AppError } from '@/shared/api/errors';
import type {
  NotificationChannel,
  NotificationChannelDraft,
} from '@/entities/notification-channel';

interface UseChannels {
  channels: NotificationChannel[];
  isLoading: boolean;
  error: AppError | null;
  create: (draft: NotificationChannelDraft) => Promise<NotificationChannel>;
  isCreating: boolean;
  createError: AppError | null;
}

export function useChannels(contactFormId: number): UseChannels {
  const query = useNotificationChannelsQuery(contactFormId);
  const mutation = useCreateNotificationChannelMutation(contactFormId);

  return {
    channels: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}
