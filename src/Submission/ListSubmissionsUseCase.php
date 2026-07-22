<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionsUseCase implements ListSubmissionsUseCaseInterface
{
    public function __construct(
        private SubmissionSearchRepositoryInterface $submissions,
        private SubmissionTagRepositoryInterface $tags,
    ) {
    }

    public function execute(SubmissionFilter $filter, int $limit, int $offset): ListSubmissionsResult
    {
        $items = $this->submissions->search($filter, $limit, $offset);
        $ids = array_values(array_filter(array_map(static fn (Submission $s): ?int => $s->id, $items), static fn (?int $id): bool => $id !== null));

        return new ListSubmissionsResult(
            items: $items,
            total: $this->submissions->countMatching($filter),
            limit: $limit,
            offset: $offset,
            statusCounts: $this->submissions->statusCounts($filter),
            tagsBySubmission: $this->tags->findTagViewsForSubmissions($ids),
        );
    }
}
