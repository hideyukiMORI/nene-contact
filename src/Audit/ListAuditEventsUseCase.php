<?php

declare(strict_types=1);

namespace NeneContact\Audit;

/**
 * Read-only listing of the audit trail for the resolved organization. The repository
 * already scopes findAll/count by organization_id (multi-tenancy), so this use case is
 * a pure read — it records no audit_event itself (see READ_ONLY_USE_CASES in
 * tools/check-usecases-audited.php).
 */
final readonly class ListAuditEventsUseCase implements ListAuditEventsUseCaseInterface
{
    public function __construct(
        private AuditEventRepositoryInterface $events,
    ) {
    }

    public function execute(int $limit, int $offset): ListAuditEventsResult
    {
        return new ListAuditEventsResult(
            items: $this->events->findAll($limit, $offset),
            total: $this->events->count(),
            limit: $limit,
            offset: $offset,
        );
    }
}
