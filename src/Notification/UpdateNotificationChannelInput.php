<?php

declare(strict_types=1);

namespace NeneContact\Notification;

final readonly class UpdateNotificationChannelInput
{
    /**
     * A partial update. `isEnabled` null leaves the flag untouched; `config` null leaves the
     * stored config untouched, otherwise its non-empty keys are merged over the stored config.
     *
     * @param array<string, mixed>|null $config
     */
    public function __construct(
        public ?bool $isEnabled,
        public ?array $config,
    ) {
    }
}
