<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface RemoveSubmissionTagUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator
     *
     * @throws SubmissionNotFoundException when the submission is not in the org
     */
    public function execute(?int $actorUserId, int $submissionId, int $tagId): void;
}
