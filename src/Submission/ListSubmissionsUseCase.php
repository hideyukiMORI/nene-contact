<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionsUseCase implements ListSubmissionsUseCaseInterface
{
    public function __construct(
        private SubmissionSearchRepositoryInterface $submissions,
    ) {
    }

    public function execute(SubmissionFilter $filter, int $limit, int $offset): ListSubmissionsResult
    {
        return new ListSubmissionsResult(
            items: $this->submissions->search($filter, $limit, $offset),
            total: $this->submissions->countMatching($filter),
            limit: $limit,
            offset: $offset,
            statusCounts: $this->submissions->statusCounts($filter),
        );
    }
}
