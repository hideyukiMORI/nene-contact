<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Soft-deletes a notification channel (ADR 0016 — never a physical row deletion). The channel
 * drops out of every admin read and of dispatch immediately; the audit trail
 * (notification_channel.deleted) proves it existed and who removed it (ADR 0013).
 */
final readonly class DeleteNotificationChannelUseCase implements DeleteNotificationChannelUseCaseInterface
{
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        // findById is org-scoped and excludes soft-deleted rows (no cross-tenant existence leak).
        $before = $this->channels->findById($id);
        if ($before === null) {
            throw new NotificationChannelNotFoundException($id);
        }

        $this->channels->softDelete($id);

        // Redacted: the config (secrets) is never copied into the trail.
        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'notification_channel.deleted',
            'notification_channel',
            $id,
            NotificationChannelResponse::toArray($before),
            null,
        );
    }
}
