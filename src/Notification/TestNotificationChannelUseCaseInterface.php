<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface TestNotificationChannelUseCaseInterface
{
    /**
     * Sends a sample notification through the channel's sender and reports the outcome.
     *
     * @throws NotificationChannelNotFoundException when the channel does not exist in the
     *                                              resolved organization.
     */
    public function execute(?int $actorUserId, int $id): TestNotificationChannelResult;
}
