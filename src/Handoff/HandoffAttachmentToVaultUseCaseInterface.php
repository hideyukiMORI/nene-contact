<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Attachment\AttachmentNotFoundException;
use NeneContact\Submission\SubmissionNotFoundException;

interface HandoffAttachmentToVaultUseCaseInterface
{
    /**
     * Archives a submission attachment in NeNe Vault as a received document and records the
     * outcome as a per-attachment SubmissionLink. Upstream failure is non-destructive: the
     * link is stored as `failed` with `last_error` for retry; the attachment and submission
     * are never touched (DO D12).
     *
     * @throws SubmissionNotFoundException when the submission does not exist in this tenant
     * @throws AttachmentNotFoundException when the attachment does not belong to the submission
     */
    public function execute(?int $actorUserId, int $submissionId, int $attachmentId): SubmissionLink;
}
