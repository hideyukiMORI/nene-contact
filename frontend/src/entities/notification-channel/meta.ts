import type { IconName } from '@/shared/ui';
import type { ChannelType } from '@/entities/notification-channel/model';

// Single source of truth for channel presentation, shared by the dedicated channels screen
// (ManageChannels) and the builder's 連携・公開 summary so the two never drift.
export const CHANNEL_TYPES: ChannelType[] = ['email', 'slack', 'chatwork', 'webhook'];

export const CHANNEL_ICON: Record<ChannelType, IconName> = {
  email: 'mail',
  slack: 'slack',
  chatwork: 'chat',
  webhook: 'code',
};
