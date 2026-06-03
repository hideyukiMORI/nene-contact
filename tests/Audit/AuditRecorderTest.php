<?php

declare(strict_types=1);

namespace NeneContact\Tests\Audit;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use PHPUnit\Framework\TestCase;

final class AuditRecorderTest extends TestCase
{
    public function test_records_before_and_after_snapshots(): void
    {
        $repo = new class () implements AuditEventRepositoryInterface {
            /** @var list<AuditEvent> */
            public array $appended = [];

            public function append(AuditEvent $event): int
            {
                $this->appended[] = $event;

                return count($this->appended);
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->appended;
            }

            public function count(): int
            {
                return count($this->appended);
            }
        };

        $recorder = new AuditRecorder($repo);
        $recorder->record(5, 7, 'contact_form.updated', 'contact_form', 42, ['name' => 'old'], ['name' => 'new']);

        self::assertCount(1, $repo->appended);
        $event = $repo->appended[0];
        self::assertSame('contact_form.updated', $event->action);
        self::assertSame('contact_form', $event->entityType);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertSame(42, $event->entityId);
        self::assertSame(['name' => 'old'], $event->before);
        self::assertSame(['name' => 'new'], $event->after);
    }
}
