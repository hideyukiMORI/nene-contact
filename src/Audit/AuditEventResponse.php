<?php

declare(strict_types=1);

namespace NeneContact\Audit;

/**
 * Serializes an {@see AuditEvent} for the admin API. before/after are the sanitized
 * snapshots recorded at mutation time (no secrets, no full PII — ADR 0013), surfaced
 * as-is so admins can see what changed.
 */
final class AuditEventResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(AuditEvent $event): array
    {
        return [
            'id' => $event->id,
            'actor_user_id' => $event->actorUserId,
            'organization_id' => $event->organizationId,
            'action' => $event->action,
            'entity_type' => $event->entityType,
            'entity_id' => $event->entityId,
            'before' => $event->before,
            'after' => $event->after,
            'created_at' => $event->createdAt,
        ];
    }
}
