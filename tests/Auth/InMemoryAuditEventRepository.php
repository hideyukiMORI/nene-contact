<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventFilter;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditEventSearchRepositoryInterface;

final class InMemoryAuditEventRepository implements AuditEventRepositoryInterface, AuditEventSearchRepositoryInterface
{
    /** @var list<AuditEvent> */
    public array $events = [];

    public function append(AuditEvent $event): int
    {
        $this->events[] = $event;

        return count($this->events);
    }

    /** @return list<AuditEvent> */
    public function search(AuditEventFilter $filter, int $limit, int $offset): array
    {
        return array_slice($this->matching($filter), $offset, $limit);
    }

    public function countMatching(AuditEventFilter $filter): int
    {
        return count($this->matching($filter));
    }

    /** @return list<AuditEvent> */
    private function matching(AuditEventFilter $filter): array
    {
        $q = $filter->q !== null ? strtolower(trim($filter->q)) : '';

        return array_values(array_filter($this->events, static function (AuditEvent $e) use ($q): bool {
            if ($q === '') {
                return true;
            }
            $hay = strtolower($e->action . ' ' . $e->entityType . ' #' . (string) ($e->entityId ?? ''));

            return str_contains($hay, $q);
        }));
    }
}
