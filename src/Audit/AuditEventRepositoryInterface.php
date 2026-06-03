<?php

declare(strict_types=1);

namespace NeneContact\Audit;

interface AuditEventRepositoryInterface
{
    public function append(AuditEvent $event): int;

    /** @return list<AuditEvent> */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
