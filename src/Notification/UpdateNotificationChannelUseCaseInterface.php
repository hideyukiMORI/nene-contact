<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface UpdateNotificationChannelUseCaseInterface
{
    /**
     * @throws NotificationChannelNotFoundException when the channel does not exist in the
     *                                              resolved organization.
     * @throws \Nene2\Validation\ValidationException when the effective config is invalid.
     */
    public function execute(?int $actorUserId, int $id, UpdateNotificationChannelInput $input): NotificationChannel;
}
