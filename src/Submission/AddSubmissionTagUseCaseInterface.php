<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface AddSubmissionTagUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator
     *
     * @throws SubmissionNotFoundException                   when the submission is not in the org
     * @throws \NeneContact\Tag\TagNotFoundException          when the tag is not in the org
     */
    public function execute(?int $actorUserId, int $submissionId, int $tagId): void;
}
