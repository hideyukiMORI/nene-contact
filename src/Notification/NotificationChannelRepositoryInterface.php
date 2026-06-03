<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface NotificationChannelRepositoryInterface
{
    public function create(NotificationChannel $channel): int;

    /**
     * Organization-scoped (admin).
     *
     * @return list<NotificationChannel>
     */
    public function listByContactForm(int $contactFormId): array;

    /**
     * Dispatch read: enabled channels for a form within an explicit organization
     * (public submit has no resolved org holder).
     *
     * @return list<NotificationChannel>
     */
    public function findEnabledByContactForm(int $contactFormId, int $organizationId): array;
}
