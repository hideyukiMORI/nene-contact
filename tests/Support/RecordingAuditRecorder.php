<?php

declare(strict_types=1);

namespace NeneContact\Tests\Support;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Test double that captures audit calls so assertions can inspect who/what/before/after.
 */
final class RecordingAuditRecorder implements AuditRecorderInterface
{
    /** @var list<array{actor: int|null, org: int|null, action: string, entityType: string, entityId: int|null, before: array<string, mixed>|null, after: array<string, mixed>|null}> */
    public array $records = [];

    public function record(?int $actorUserId, ?int $organizationId, string $action, string $entityType, ?int $entityId, ?array $before, ?array $after): void
    {
        $this->records[] = [
            'actor' => $actorUserId,
            'org' => $organizationId,
            'action' => $action,
            'entityType' => $entityType,
            'entityId' => $entityId,
            'before' => $before,
            'after' => $after,
        ];
    }
}
