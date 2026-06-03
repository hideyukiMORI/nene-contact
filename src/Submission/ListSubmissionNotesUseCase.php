<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionNotesUseCase implements ListSubmissionNotesUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private SubmissionNoteRepositoryInterface $notes,
    ) {
    }

    /** @return list<SubmissionNote> */
    public function execute(int $submissionId): array
    {
        if ($this->submissions->findById($submissionId) === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        return $this->notes->listBySubmission($submissionId);
    }
}
