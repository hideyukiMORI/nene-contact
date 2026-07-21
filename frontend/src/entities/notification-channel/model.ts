export type ChannelType = 'email' | 'slack' | 'chatwork' | 'webhook';

export interface NotificationChannel {
  id: number;
  contactFormId: number;
  channelType: ChannelType;
  isEnabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotificationChannelDraft {
  contactFormId: number;
  channelType: ChannelType;
  config: Record<string, string>;
  isEnabled: boolean;
}

// A partial edit: `config` carries only the keys the operator changed (blank values are
// dropped server-side so a secret need not be re-entered); `isEnabled` toggles the channel.
export interface NotificationChannelUpdate {
  config?: Record<string, string>;
  isEnabled?: boolean;
}

export interface NotificationChannelTestResult {
  ok: boolean;
  error: string | null;
}
