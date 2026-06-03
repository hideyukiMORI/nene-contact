<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface SubmissionNoteRepositoryInterface
{
    public function create(SubmissionNote $note): int;

    /** @return list<SubmissionNote> */
    public function listBySubmission(int $submissionId): array;
}
