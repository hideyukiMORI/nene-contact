<?php

declare(strict_types=1);

namespace NeneContact\Notification;

/**
 * Presents a notification channel. The full `config` (which may hold webhook URLs/tokens
 * for slack/chatwork) is never returned or audited; only the channel type and enabled
 * flag are exposed (charter §6/§10).
 */
final readonly class NotificationChannelResponse
{
    /** @return array<string, mixed> */
    public static function toArray(NotificationChannel $channel): array
    {
        return [
            'id' => $channel->id,
            'contact_form_id' => $channel->contactFormId,
            'channel_type' => $channel->channelType,
            'is_enabled' => $channel->isEnabled,
            'created_at' => $channel->createdAt,
            'updated_at' => $channel->updatedAt,
        ];
    }
}
