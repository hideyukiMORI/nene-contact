<?php

declare(strict_types=1);

namespace NeneContact\Notification;

interface NotificationChannelRepositoryInterface
{
    public function create(NotificationChannel $channel): int;

    /**
     * Organization-scoped detail read; excludes soft-deleted channels. Returns null when the
     * id belongs to another tenant or has been removed (no existence leak).
     */
    public function findById(int $id): ?NotificationChannel;

    /**
     * Replaces the config and enabled flag of an existing channel (org-scoped, not
     * soft-deleted). Identity — id, organization, contact form, type — is preserved.
     */
    public function update(NotificationChannel $channel): void;

    /**
     * Soft-deletes a channel (ADR 0016 — stamps deleted_at, never a physical DELETE).
     * Org-scoped; a no-op for another tenant's or an already-removed id.
     */
    public function softDelete(int $id): void;

    /**
     * Organization-scoped (admin); excludes soft-deleted channels.
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
