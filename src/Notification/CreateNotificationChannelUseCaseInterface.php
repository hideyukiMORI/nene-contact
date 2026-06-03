<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface CreateNotificationChannelUseCaseInterface
{
    public function execute(?int $actorUserId, CreateNotificationChannelInput $input): NotificationChannel;
}
