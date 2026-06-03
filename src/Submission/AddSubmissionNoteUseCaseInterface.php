<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface AddSubmissionNoteUseCaseInterface
{
    public function execute(?int $actorUserId, int $submissionId, string $body): SubmissionNote;
}
