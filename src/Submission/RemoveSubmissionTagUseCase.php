<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\ClockInterface;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Removes a tag from a submission (ADR 0019). The submission is resolved org-scoped (a foreign
 * submission is a 404); the removal is a soft remove (ADR 0016) and idempotent (removing a tag
 * that is not applied is a no-op). Persists then audits `submission.untagged` — snapshot carries
 * `{tag_id}`, no field values (ADR 0013).
 */
final readonly class RemoveSubmissionTagUseCase implements RemoveSubmissionTagUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private SubmissionTagRepositoryInterface $assignments,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
    ) {
    }

    public function execute(?int $actorUserId, int $submissionId, int $tagId): void
    {
        $submission = $this->submissions->findById($submissionId);
        if ($submission === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        $now = $this->clock->now()->format('Y-m-d H:i:s');
        $this->assignments->remove($submissionId, $tagId, $now);

        $this->audit->record(
            $actorUserId,
            $submission->organizationId,
            'submission.untagged',
            'submission',
            $submissionId,
            null,
            ['tag_id' => $tagId],
        );
    }
}
