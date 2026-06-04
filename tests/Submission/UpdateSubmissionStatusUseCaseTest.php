<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Submission\UpdateSubmissionStatusUseCase;
use PHPUnit\Framework\TestCase;

final class UpdateSubmissionStatusUseCaseTest extends TestCase
{
    private function repo(?Submission $seed): SubmissionRepositoryInterface
    {
        return new class ($seed) implements SubmissionRepositoryInterface {
            public ?string $updatedTo = null;

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
                $this->updatedTo = $status;
                if ($this->current !== null) {
                    $this->current = new Submission(
                        organizationId: $this->current->organizationId,
                        contactFormId: $this->current->contactFormId,
                        fieldValues: $this->current->fieldValues,
                        status: $status,
                        id: $this->current->id,
                    );
                }
            }

            public function softDelete(int $id): void
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
    }

    public function test_updates_status_and_records_before_after_audit(): void
    {
        $repo = $this->repo(new Submission(organizationId: 7, contactFormId: 2, fieldValues: ['email' => 'x@example.com'], status: 'open', id: 9));
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

        $useCase = new UpdateSubmissionStatusUseCase($repo, new AuditRecorder($auditRepo));
        $result = $useCase->execute(5, 9, 'resolved');

        self::assertSame('resolved', $result->status);
        self::assertCount(1, $auditRepo->events);
        $event = $auditRepo->events[0];
        self::assertSame('submission.updated', $event->action);
        self::assertSame('open', $event->before['status'] ?? null);
        self::assertSame('resolved', $event->after['status'] ?? null);
        // Redacted: no raw field values in the trail.
        self::assertStringNotContainsString('x@example.com', json_encode([$event->before, $event->after], JSON_THROW_ON_ERROR));
    }

    public function test_rejects_unknown_submission(): void
    {
        $auditRepo = new class () implements AuditEventRepositoryInterface {
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

        $useCase = new UpdateSubmissionStatusUseCase($this->repo(null), new AuditRecorder($auditRepo));

        $this->expectException(SubmissionNotFoundException::class);

        $useCase->execute(5, 404, 'spam');
    }
}
