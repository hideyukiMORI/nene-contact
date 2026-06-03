<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface ListSubmissionNotesUseCaseInterface
{
    /** @return list<SubmissionNote> */
    public function execute(int $submissionId): array;
}
