<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;

interface GetAgentSubmissionUseCaseInterface
{
    /**
     * Fetches one submission for the agent surface. When $includePii is true the raw values
     * will be returned, so this records an audited PII access (`submission.viewed`, §11).
     *
     * @throws SubmissionNotFoundException when the submission does not exist in this tenant
     */
    public function execute(int $id, bool $includePii): Submission;
}
