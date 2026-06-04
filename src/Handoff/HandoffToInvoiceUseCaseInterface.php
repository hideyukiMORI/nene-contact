<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Submission\SubmissionNotFoundException;

interface HandoffToInvoiceUseCaseInterface
{
    /**
     * Hands the submission to NeNe Invoice (create draft client) and records the outcome as a
     * SubmissionLink. Upstream failure is non-destructive: the link is stored as `failed` with
     * `last_error` for retry; the submission is never touched.
     *
     * @throws SubmissionNotFoundException when the submission does not exist in this tenant
     */
    public function execute(?int $actorUserId, int $submissionId): SubmissionLink;
}
