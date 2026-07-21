<?php

declare(strict_types=1);

namespace NeneContact\Notification;

final readonly class GetNotificationChannelUseCase implements GetNotificationChannelUseCaseInterface
{
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
    ) {
    }

    public function execute(int $id): NotificationChannel
    {
        // findById is org-scoped and excludes soft-deleted rows, so a cross-tenant or removed
        // id reads as not found (no existence leak).
        $channel = $this->channels->findById($id);
        if ($channel === null) {
            throw new NotificationChannelNotFoundException($id);
        }

        return $channel;
    }
}
