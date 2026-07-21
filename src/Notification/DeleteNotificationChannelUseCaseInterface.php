<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface DeleteNotificationChannelUseCaseInterface
{
    /**
     * @throws NotificationChannelNotFoundException when the channel does not exist in the
     *                                              resolved organization.
     */
    public function execute(?int $actorUserId, int $id): void;
}
