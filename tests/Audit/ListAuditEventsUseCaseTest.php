<?php

declare(strict_types=1);

namespace NeneContact\Tests\Audit;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\ListAuditEventsUseCase;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class ListAuditEventsUseCaseTest extends TestCase
{
    public function test_returns_events_with_pagination_meta(): void
    {
        $repo = new InMemoryAuditEventRepository();
        $repo->append(new AuditEvent(action: 'organization.created', entityType: 'organization', entityId: 1));
        $repo->append(new AuditEvent(action: 'user.created', entityType: 'user', entityId: 2));

        $result = (new ListAuditEventsUseCase($repo))->execute(20, 0);

        self::assertSame(20, $result->limit);
        self::assertSame(0, $result->offset);
        self::assertSame(2, $result->total);
        self::assertCount(2, $result->items);
        self::assertSame('organization.created', $result->items[0]->action);
    }
}
