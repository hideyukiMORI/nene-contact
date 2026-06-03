<?php

declare(strict_types=1);

namespace NeneContact\Notification;

final readonly class CreateNotificationChannelInput
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        public int $contactFormId,
        public string $channelType,
        public array $config,
        public bool $isEnabled = true,
    ) {
    }
}
