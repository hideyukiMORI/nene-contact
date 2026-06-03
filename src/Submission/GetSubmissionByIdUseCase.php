<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class GetSubmissionByIdUseCase implements GetSubmissionByIdUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
    ) {
    }

    public function execute(int $id): Submission
    {
        $submission = $this->submissions->findById($id);

        if ($submission === null) {
            throw new SubmissionNotFoundException($id);
        }

        return $submission;
    }
}
