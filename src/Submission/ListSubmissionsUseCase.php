<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionsUseCase implements ListSubmissionsUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
    ) {
    }

    public function execute(int $limit, int $offset): ListSubmissionsResult
    {
        return new ListSubmissionsResult(
            items: $this->submissions->findAll($limit, $offset),
            total: $this->submissions->count(),
            limit: $limit,
            offset: $offset,
        );
    }
}
