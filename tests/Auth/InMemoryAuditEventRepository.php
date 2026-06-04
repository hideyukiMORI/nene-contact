<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;

final class InMemoryAuditEventRepository implements AuditEventRepositoryInterface
{
    /** @var list<AuditEvent> */
    public array $events = [];

    public function append(AuditEvent $event): int
    {
        $this->events[] = $event;

        return count($this->events);
    }

    /** @return list<AuditEvent> */
    public function findAll(int $limit, int $offset): array
    {
        return $this->events;
    }

    public function count(): int
    {
        return count($this->events);
    }
}
