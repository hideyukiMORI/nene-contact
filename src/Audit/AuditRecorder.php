<?php

declare(strict_types=1);

namespace NeneContact\Audit;

final readonly class AuditRecorder implements AuditRecorderInterface
{
    public function __construct(
        private AuditEventRepositoryInterface $repository,
    ) {
    }

    public function record(
        ?int $actorUserId,
        ?int $organizationId,
        string $action,
        string $entityType,
        ?int $entityId,
        ?array $before,
        ?array $after,
    ): void {
        $this->repository->append(new AuditEvent(
            action: $action,
            entityType: $entityType,
            actorUserId: $actorUserId,
            organizationId: $organizationId,
            entityId: $entityId,
            before: $before,
            after: $after,
        ));
    }
}
