<?php

declare(strict_types=1);

namespace NeneContact\Notification;

/**
 * Outcome of an operator-initiated test send. `ok=false` with an `error` surfaces a silent
 * dispatch failure (the normal submit path swallows sender errors by design) so the operator
 * can discover a misconfigured channel.
 */
final readonly class TestNotificationChannelResult
{
    public function __construct(
        public bool $ok,
        public ?string $error = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['ok' => $this->ok, 'error' => $this->error];
    }
}
