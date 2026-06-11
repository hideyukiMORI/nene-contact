<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Discloses a submission's technical reception metadata (IP / User-Agent), which the default
 * payloads deliberately omit (charter §2/§11). The disclosure is a sensitive **read**: it
 * records an audit event before returning so every access to this abuse-investigation data
 * leaves a who/when/what trail (ADR 0018, audit-logging §1). The audit snapshot itself stays
 * redacted — the IP/UA values are never written into the trail (charter §10).
 */
final readonly class GetSubmissionTechnicalMetaUseCase implements GetSubmissionTechnicalMetaUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id): Submission
    {
        $submission = $this->submissions->findById($id);

        if ($submission === null) {
            throw new SubmissionNotFoundException($id);
        }

        $this->audit->record(
            $actorUserId,
            $submission->organizationId,
            'submission_technical_meta.viewed',
            'submission',
            $id,
            null,
            SubmissionResponse::toAuditSnapshot($submission),
        );

        return $submission;
    }
}
