<?php

declare(strict_types=1);

namespace NeneContact\Audit;

final readonly class ListAuditEventsResult
{
    /**
     * @param list<AuditEvent> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $limit,
        public int $offset,
    ) {
    }
}
