<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelRepositoryInterface;

/**
 * In-memory {@see NotificationChannelRepositoryInterface} for use-case tests. Soft-delete is
 * modeled by a deleted-id set so reads exclude it exactly as the SQL `deleted_at IS NULL`
 * filter does.
 */
final class InMemoryNotificationChannelRepository implements NotificationChannelRepositoryInterface
{
    /** @var array<int, NotificationChannel> */
    public array $byId = [];

    /** @var array<int, true> */
    public array $deleted = [];

    private int $nextId = 1;

    public function seed(NotificationChannel $channel): int
    {
        $id = $channel->id ?? $this->nextId++;
        $this->byId[$id] = new NotificationChannel(
            organizationId: $channel->organizationId,
            contactFormId: $channel->contactFormId,
            channelType: $channel->channelType,
            config: $channel->config,
            isEnabled: $channel->isEnabled,
            id: $id,
            createdAt: $channel->createdAt ?? '2026-07-21 00:00:00',
            updatedAt: $channel->updatedAt ?? '2026-07-21 00:00:00',
        );

        return $id;
    }

    public function create(NotificationChannel $channel): int
    {
        return $this->seed($channel);
    }

    public function findById(int $id): ?NotificationChannel
    {
        if (isset($this->deleted[$id])) {
            return null;
        }

        return $this->byId[$id] ?? null;
    }

    public function update(NotificationChannel $channel): void
    {
        $id = (int) $channel->id;
        if (isset($this->deleted[$id]) || !isset($this->byId[$id])) {
            return;
        }

        $this->byId[$id] = new NotificationChannel(
            organizationId: $channel->organizationId,
            contactFormId: $channel->contactFormId,
            channelType: $channel->channelType,
            config: $channel->config,
            isEnabled: $channel->isEnabled,
            id: $id,
            createdAt: $this->byId[$id]->createdAt,
            updatedAt: '2026-07-21 01:00:00',
        );
    }

    public function softDelete(int $id): void
    {
        $this->deleted[$id] = true;
    }

    /** @return list<NotificationChannel> */
    public function listByContactForm(int $contactFormId): array
    {
        $out = [];
        foreach ($this->byId as $id => $channel) {
            if (!isset($this->deleted[$id]) && $channel->contactFormId === $contactFormId) {
                $out[] = $channel;
            }
        }

        return $out;
    }

    /** @return list<NotificationChannel> */
    public function findEnabledByContactForm(int $contactFormId, int $organizationId): array
    {
        $out = [];
        foreach ($this->byId as $id => $channel) {
            if (!isset($this->deleted[$id])
                && $channel->contactFormId === $contactFormId
                && $channel->organizationId === $organizationId
                && $channel->isEnabled
            ) {
                $out[] = $channel;
            }
        }

        return $out;
    }
}
