export type ChannelType = 'email' | 'slack' | 'chatwork' | 'webhook';

export interface NotificationChannel {
  id: number;
  contactFormId: number;
  channelType: ChannelType;
  isEnabled: boolean;
}

export interface NotificationChannelDraft {
  contactFormId: number;
  channelType: ChannelType;
  config: Record<string, string>;
  isEnabled: boolean;
}
