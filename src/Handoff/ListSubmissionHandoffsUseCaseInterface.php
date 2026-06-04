<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Submission\SubmissionNotFoundException;

interface ListSubmissionHandoffsUseCaseInterface
{
    /**
     * Lists the handoff links for a submission (status + sibling pointers per target).
     *
     * @return list<SubmissionLink>
     *
     * @throws SubmissionNotFoundException when the submission does not exist in this tenant
     */
    public function execute(int $submissionId): array;
}
