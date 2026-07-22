<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Submission\AddSubmissionTagUseCase;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Tag\CreateTagInput;
use NeneContact\Tag\CreateTagUseCase;
use NeneContact\Tag\TagNotFoundException;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemorySubmissionTagRepository;
use NeneContact\Tests\Support\InMemoryTagRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class AddSubmissionTagUseCaseTest extends TestCase
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

    public function test_applies_tag_and_audits(): void
    {
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $clock = new FixedClock('2026-07-23T09:00:00+00:00');

        $tags = new InMemoryTagRepository();
        $tag = (new CreateTagUseCase($tags, new RecordingAuditRecorder(), $clock, $orgId))
            ->execute(3, new CreateTagInput(label: '見積依頼', color: 'amber'));
        $tagId = $tag->id;
        self::assertNotNull($tagId);

        $assignments = new InMemorySubmissionTagRepository();
        $audit = new RecordingAuditRecorder();
        $submission = new Submission(organizationId: 7, contactFormId: 1, fieldValues: [], id: 42);

        (new AddSubmissionTagUseCase($this->submissions($submission), $tags, $assignments, $audit, $clock))
            ->execute(3, 42, $tagId);

        self::assertSame(1, $assignments->activeCount());
        self::assertCount(1, $assignments->added);
        self::assertCount(1, $audit->records);
        self::assertSame('submission.tagged', $audit->records[0]['action']);
        self::assertSame('submission', $audit->records[0]['entityType']);
        self::assertNotNull($audit->records[0]['after']);
        self::assertSame($tagId, $audit->records[0]['after']['tag_id']);
        self::assertSame('見積依頼', $audit->records[0]['after']['label']);
    }

    public function test_unknown_submission_is_not_found(): void
    {
        $orgId = new RequestScopedHolder();
        $orgId->set(7);
        $useCase = new AddSubmissionTagUseCase(
            $this->submissions(null),
            new InMemoryTagRepository(),
            new InMemorySubmissionTagRepository(),
            new RecordingAuditRecorder(),
            new FixedClock('2026-07-23T09:00:00+00:00'),
        );

        $this->expectException(SubmissionNotFoundException::class);
        $useCase->execute(3, 999, 1);
    }

    public function test_foreign_or_unknown_tag_is_not_found(): void
    {
        $submission = new Submission(organizationId: 7, contactFormId: 1, fieldValues: [], id: 42);
        // Empty tag repo → the tag id resolves to nothing in this org.
        $useCase = new AddSubmissionTagUseCase(
            $this->submissions($submission),
            new InMemoryTagRepository(),
            new InMemorySubmissionTagRepository(),
            new RecordingAuditRecorder(),
            new FixedClock('2026-07-23T09:00:00+00:00'),
        );

        $this->expectException(TagNotFoundException::class);
        $useCase->execute(3, 42, 555);
    }
}
