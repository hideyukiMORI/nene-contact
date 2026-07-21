<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use RuntimeException;

final class NotificationChannelNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Notification channel {$id} not found.");
    }
}
