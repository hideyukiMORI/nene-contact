export const notificationChannelKeys = {
  all: ['notification-channels'] as const,
  list: (contactFormId: number) => [...notificationChannelKeys.all, contactFormId] as const,
};
