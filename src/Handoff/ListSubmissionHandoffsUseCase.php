<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;

final readonly class ListSubmissionHandoffsUseCase implements ListSubmissionHandoffsUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private SubmissionLinkRepositoryInterface $links,
    ) {
    }

    public function execute(int $submissionId): array
    {
        // Reads are organization-scoped via the repositories (ADR 0006); confirm the
        // submission belongs to this tenant before exposing its handoff links.
        if ($this->submissions->findById($submissionId) === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        return $this->links->findBySubmission($submissionId);
    }
}
