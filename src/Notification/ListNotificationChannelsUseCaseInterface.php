<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface ListNotificationChannelsUseCaseInterface
{
    /** @return list<NotificationChannel> */
    public function execute(int $contactFormId): array;
}
