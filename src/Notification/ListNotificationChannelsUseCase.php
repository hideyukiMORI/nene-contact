<?php

declare(strict_types=1);

namespace NeneContact\Notification;

final readonly class ListNotificationChannelsUseCase implements ListNotificationChannelsUseCaseInterface
{
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
    ) {
    }

    /** @return list<NotificationChannel> */
    public function execute(int $contactFormId): array
    {
        return $this->channels->listByContactForm($contactFormId);
    }
}
