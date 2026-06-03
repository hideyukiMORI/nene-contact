<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\ExportSubmissionsUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class ExportSubmissionsUseCaseTest extends TestCase
{
    public function test_builds_csv_and_audits_export_without_pii(): void
    {
        $repo = new class () implements SubmissionRepositoryInterface {
            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return null;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return [
                    new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'a@example.com'], status: 'open', id: 1, submittedAt: '2026-06-04 00:00:00'),
                    new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'b@example.com'], status: 'resolved', id: 2, submittedAt: '2026-06-04 01:00:00'),
                ];
            }

            public function count(): int
            {
                return 2;
            }
        };

        $auditRepo = new class () implements AuditEventRepositoryInterface {
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
        };

        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set(7);

        $csv = (new ExportSubmissionsUseCase($repo, new AuditRecorder($auditRepo), $holder))->execute(5);

        $lines = array_values(array_filter(explode("\n", trim($csv))));
        self::assertCount(3, $lines); // header + 2 rows
        self::assertStringContainsString('id,contact_form_id,status,submitted_at,field_values', $lines[0]);
        self::assertStringContainsString('a@example.com', $csv);

        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('submission.exported', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(['count' => 2], $event->after);
        // The export audit must not copy the exported PII.
        self::assertStringNotContainsString('a@example.com', json_encode($event->after, JSON_THROW_ON_ERROR));
    }
}
