<?php

declare(strict_types=1);

namespace NeneContact\Audit;

/**
 * One recorded mutating operation or PII access (ADR 0013).
 *
 * `before` / `after` are sanitized snapshots (no secrets, no full PII) of the affected
 * entity. `before` is null for creates; `after` is null for deletes.
 */
final readonly class AuditEvent
{
    /**
     * @param array<string, mixed>|null $before
     * @param array<string, mixed>|null $after
     */
    public function __construct(
        public string $action,
        public string $entityType,
        public ?int $actorUserId = null,
        public ?int $organizationId = null,
        public ?int $entityId = null,
        public ?array $before = null,
        public ?array $after = null,
        public ?int $id = null,
        public ?string $createdAt = null,
    ) {
    }
}
