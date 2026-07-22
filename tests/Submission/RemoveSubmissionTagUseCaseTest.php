<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Submission\RemoveSubmissionTagUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemorySubmissionTagRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class RemoveSubmissionTagUseCaseTest extends TestCase
{
    private function submissions(?Submission $seed): SubmissionRepositoryInterface
    {
        return new class ($seed) implements SubmissionRepositoryInterface {
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
    }

    public function test_removes_tag_and_audits(): void
    {
        $assignments = new InMemorySubmissionTagRepository();
        $assignments->add(42, 5, '2026-07-23 09:00:00');
        $audit = new RecordingAuditRecorder();
        $submission = new Submission(organizationId: 7, contactFormId: 1, fieldValues: [], id: 42);

        (new RemoveSubmissionTagUseCase($this->submissions($submission), $assignments, $audit, new FixedClock('2026-07-23T10:00:00+00:00')))
            ->execute(3, 42, 5);

        self::assertSame(0, $assignments->activeCount());
        self::assertCount(1, $assignments->removed);
        self::assertCount(1, $audit->records);
        self::assertSame('submission.untagged', $audit->records[0]['action']);
        self::assertNotNull($audit->records[0]['after']);
        self::assertSame(5, $audit->records[0]['after']['tag_id']);
    }

    public function test_unknown_submission_is_not_found(): void
    {
        $useCase = new RemoveSubmissionTagUseCase(
            $this->submissions(null),
            new InMemorySubmissionTagRepository(),
            new RecordingAuditRecorder(),
            new FixedClock('2026-07-23T10:00:00+00:00'),
        );

        $this->expectException(SubmissionNotFoundException::class);
        $useCase->execute(3, 999, 5);
    }
}
