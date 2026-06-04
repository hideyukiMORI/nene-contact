<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Soft-deletes a submission to honor a data-subject deletion / suspension request
 * (charter §4). The record is hidden from the inbox immediately; the purge job
 * hard-deletes the personal data after a grace period (§5). The audit trail proves
 * a record existed and who deleted it, without re-storing PII (ADR 0013).
 */
final readonly class DeleteSubmissionUseCase implements DeleteSubmissionUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        $before = $this->submissions->findById($id);

        if ($before === null) {
            throw new SubmissionNotFoundException($id);
        }

        $this->submissions->softDelete($id);

        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'submission.deleted',
            'submission',
            $id,
            SubmissionResponse::toAuditSnapshot($before),
            null,
        );
    }
}
