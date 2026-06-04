<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\DeleteSubmissionUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class DeleteSubmissionUseCaseTest extends TestCase
{
    public function test_soft_deletes_and_records_redacted_audit(): void
    {
        $repo = new class (new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'x@example.com'], status: 'open', id: 9)) implements SubmissionRepositoryInterface {
            public bool $softDeleted = false;

            public function __construct(private ?Submission $current)
            {
            }

            public function create(Submission $submission): int
            {
                return 1;
            }

            public function findById(int $id): ?Submission
            {
                return $this->current;
            }

            public function updateStatus(int $id, string $status): void
            {
            }

            public function softDelete(int $id): void
            {
                $this->softDeleted = true;
                $this->current = null;
            }

            /** @param array<string, mixed> $values */
            public function updateFieldValues(int $id, array $values): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };

        $audit = new class () implements AuditEventRepositoryInterface {
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

        $useCase = new DeleteSubmissionUseCase($repo, new AuditRecorder($audit));
        $useCase->execute(5, 9);

        self::assertTrue($repo->softDeleted);
        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('submission.deleted', $event->action);
        self::assertSame(5, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertNull($event->after);
        self::assertSame(['email'], $event->before['field_keys'] ?? null);
        // Redacted: the submitted value is never written to the audit trail.
        self::assertStringNotContainsString('x@example.com', json_encode($event->before, JSON_THROW_ON_ERROR));
    }

    public function test_rejects_unknown_or_already_deleted_submission(): void
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

            public function softDelete(int $id): void
            {
            }

            /** @param array<string, mixed> $values */
            public function updateFieldValues(int $id, array $values): void
            {
            }

            /** @return list<Submission> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };

        $audit = new class () implements AuditEventRepositoryInterface {
            public function append(AuditEvent $event): int
            {
                return 1;
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };

        $useCase = new DeleteSubmissionUseCase($repo, new AuditRecorder($audit));

        $this->expectException(SubmissionNotFoundException::class);

        $useCase->execute(5, 404);
    }
}
