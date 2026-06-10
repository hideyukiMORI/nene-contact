<?php

declare(strict_types=1);

namespace NeneContact\Audit;

/**
 * Read side of the audit trail (the viewer). Kept separate from
 * {@see AuditEventRepositoryInterface} so the many write-only audit doubles in the test
 * suite (which only need `append`) don't have to implement search — same split as the
 * submission read/write interfaces.
 */
interface AuditEventSearchRepositoryInterface
{
    /** @return list<AuditEvent> */
    public function search(AuditEventFilter $filter, int $limit, int $offset): array;

    public function countMatching(AuditEventFilter $filter): int;
}
