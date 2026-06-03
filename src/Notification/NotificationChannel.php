<?php

declare(strict_types=1);

namespace NeneContact\Notification;

final readonly class NotificationChannel
{
    /**
     * @param array<string, mixed> $config channel-specific config (e.g. email recipient)
     */
    public function __construct(
        public int $organizationId,
        public int $contactFormId,
        public string $channelType,
        public array $config,
        public bool $isEnabled = true,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
