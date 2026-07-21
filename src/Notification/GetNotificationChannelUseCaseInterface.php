<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface GetNotificationChannelUseCaseInterface
{
    /**
     * @throws NotificationChannelNotFoundException when the channel does not exist in the
     *                                              resolved organization.
     */
    public function execute(int $id): NotificationChannel;
}
