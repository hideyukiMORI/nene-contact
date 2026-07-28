<?php

declare(strict_types=1);

namespace NeneContact\Tests\Audit;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventFilter;
use NeneContact\Audit\AuditEventSearchRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Audit\ExportAuditEventsUseCase;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class ExportAuditEventsUseCaseTest extends TestCase
{
    public function test_builds_csv_of_the_matching_events_and_passes_the_filter_through(): void
    {
        $search = new class () implements AuditEventSearchRepositoryInterface {
            public ?AuditEventFilter $receivedFilter = null;

            /** @return list<AuditEvent> */
            public function search(AuditEventFilter $filter, int $limit, int $offset): array
            {
                $this->receivedFilter = $filter;

                return ExportAuditEventsUseCaseTest::events();
            }

            public function countMatching(AuditEventFilter $filter): int
            {
                return 2;
            }
        };

        $filter = new AuditEventFilter(q: 'contact_form', from: '2026-07-01', to: null);
        $csv = (new ExportAuditEventsUseCase($search, new AuditRecorder(new InMemoryAuditEventRepository()), self::orgHolder()))
            ->execute($filter, 5);

        // The filter reaches the (tenant-scoped) repository unchanged: the file matches the view.
        self::assertSame($filter, $search->receivedFilter);

        $lines = array_values(array_filter(explode("\n", trim($csv))));
        self::assertCount(3, $lines); // header + 2 rows
        self::assertStringContainsString('id,created_at,actor_user_id,action,entity_type,entity_id,before,after', $lines[0]);
        self::assertStringContainsString('contact_form.updated', $csv);
        // Snapshots ship as embedded JSON; a null snapshot is an empty cell, not "null".
        self::assertStringContainsString('"{""name"":""after""}"', $csv);
        self::assertStringContainsString('1,"2026-07-24 00:00:00",,contact_form.created,contact_form,,,', $csv);
    }

    public function test_records_the_export_with_the_count_and_filter_but_no_snapshots(): void
    {
        $auditRepo = new InMemoryAuditEventRepository();

        (new ExportAuditEventsUseCase(self::searchRepository(), new AuditRecorder($auditRepo), self::orgHolder()))
            ->execute(new AuditEventFilter(q: 'contact_form', from: '2026-07-01', to: null), 5);

        $events = $auditRepo->events;
        self::assertCount(1, $events);
        self::assertSame('audit_event.exported', $events[0]->action);
        self::assertSame('audit_event', $events[0]->entityType);
        self::assertSame(5, $events[0]->actorUserId);
        self::assertSame(7, $events[0]->organizationId);
        self::assertNull($events[0]->before);
        self::assertSame(
            ['count' => 2, 'filter' => ['q' => 'contact_form', 'from' => '2026-07-01', 'to' => null]],
            $events[0]->after,
        );
        // The record of a bulk read must not copy what was read.
        self::assertStringNotContainsString('"name"', json_encode($events[0]->after, JSON_THROW_ON_ERROR));
    }

    public function test_an_actorless_export_is_still_recorded(): void
    {
        $auditRepo = new InMemoryAuditEventRepository();

        (new ExportAuditEventsUseCase(self::searchRepository(), new AuditRecorder($auditRepo), self::orgHolder()))
            ->execute(new AuditEventFilter(), null);

        $events = $auditRepo->events;
        self::assertCount(1, $events);
        self::assertNull($events[0]->actorUserId);
    }

    /** @return list<AuditEvent> */
    public static function events(): array
    {
        return [
            new AuditEvent(
                action: 'contact_form.updated',
                entityType: 'contact_form',
                actorUserId: 3,
                organizationId: 7,
                entityId: 12,
                before: ['name' => 'before'],
                after: ['name' => 'after'],
                id: 2,
                createdAt: '2026-07-24 01:00:00',
            ),
            new AuditEvent(
                action: 'contact_form.created',
                entityType: 'contact_form',
                actorUserId: null,
                organizationId: 7,
                entityId: null,
                before: null,
                after: null,
                id: 1,
                createdAt: '2026-07-24 00:00:00',
            ),
        ];
    }

    private static function searchRepository(): AuditEventSearchRepositoryInterface
    {
        return new class () implements AuditEventSearchRepositoryInterface {
            /** @return list<AuditEvent> */
            public function search(AuditEventFilter $filter, int $limit, int $offset): array
            {
                return ExportAuditEventsUseCaseTest::events();
            }

            public function countMatching(AuditEventFilter $filter): int
            {
                return 2;
            }
        };
    }

    /** @return RequestScopedHolder<int> */
    private static function orgHolder(): RequestScopedHolder
    {
        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set(7);

        return $holder;
    }
}
