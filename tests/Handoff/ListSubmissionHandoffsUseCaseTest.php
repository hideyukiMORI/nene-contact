<?php

declare(strict_types=1);

namespace NeneContact\Tests\Handoff;

use NeneContact\Handoff\ListSubmissionHandoffsUseCase;
use NeneContact\Handoff\SubmissionLink;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class ListSubmissionHandoffsUseCaseTest extends TestCase
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

    public function test_lists_links_for_existing_submission(): void
    {
        $links = new InMemorySubmissionLinkRepository();
        $links->save(new SubmissionLink(organizationId: 7, submissionId: 9, target: SubmissionLink::TARGET_DEAL, handoffStatus: SubmissionLink::STATUS_SUCCEEDED, dealOpportunityId: 'opp_1'));

        $useCase = new ListSubmissionHandoffsUseCase($this->submissions(new Submission(organizationId: 7, contactFormId: 2, fieldValues: [], status: 'open', id: 9)), $links);
        $result = $useCase->execute(9);

        self::assertCount(1, $result);
        self::assertSame('opp_1', $result[0]->dealOpportunityId);
    }

    public function test_rejects_unknown_submission(): void
    {
        $useCase = new ListSubmissionHandoffsUseCase($this->submissions(null), new InMemorySubmissionLinkRepository());

        $this->expectException(SubmissionNotFoundException::class);
        $useCase->execute(404);
    }
}
