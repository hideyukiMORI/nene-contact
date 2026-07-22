<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class GetSubmissionByIdUseCase implements GetSubmissionByIdUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private SubmissionTagRepositoryInterface $tags,
    ) {
    }

    public function execute(int $id): SubmissionWithTags
    {
        $submission = $this->submissions->findById($id);

        if ($submission === null) {
            throw new SubmissionNotFoundException($id);
        }

        return new SubmissionWithTags($submission, $this->tags->findTagViewsForSubmission($id));
    }
}
