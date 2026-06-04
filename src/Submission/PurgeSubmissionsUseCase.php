<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Retention purge (charter §5), run as a system job (no authenticated actor).
 *
 * Stage 1 — retention expiry: an active submission whose age exceeds its form's
 * retention (override, else {@see RetentionPolicy::DEFAULT_RETENTION_DAYS}) is
 * soft-deleted and audited `submission.expired`.
 *
 * Stage 2 — grace expiry: a submission soft-deleted longer than
 * {@see RetentionPolicy::GRACE_DAYS} has its personal data erased in place (ADR 0016 —
 * the row survives for the audit trail) and is audited `submission.purged`.
 *
 * Audit snapshots carry no PII; deletion stays provable. With $apply = false the use
 * case only counts candidates (dry-run), so operators can preview before destruction.
 */
final readonly class PurgeSubmissionsUseCase implements PurgeSubmissionsUseCaseInterface
{
    public function __construct(
        private SubmissionPurgeRepositoryInterface $repository,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(bool $apply): PurgeResult
    {
        $now = time();
        $expired = 0;
        $purged = 0;

        foreach ($this->repository->findActiveWithRetention(RetentionPolicy::DEFAULT_RETENTION_DAYS) as $row) {
            $cutoff = strtotime($row['submitted_at']) + ($row['retention_days'] * 86400);
            if ($cutoff >= $now) {
                continue;
            }

            if ($apply) {
                $this->repository->softDeleteById($row['id']);
                $this->audit->record(
                    null,
                    $row['organization_id'],
                    'submission.expired',
                    'submission',
                    $row['id'],
                    ['reason' => 'retention', 'retention_days' => $row['retention_days']],
                    null,
                );
            }

            $expired++;
        }

        foreach ($this->repository->findSoftDeleted() as $row) {
            $cutoff = strtotime($row['deleted_at']) + (RetentionPolicy::GRACE_DAYS * 86400);
            if ($cutoff >= $now) {
                continue;
            }

            if ($apply) {
                $this->repository->erasePiiById($row['id']);
                $this->audit->record(
                    null,
                    $row['organization_id'],
                    'submission.purged',
                    'submission',
                    $row['id'],
                    null,
                    null,
                );
            }

            $purged++;
        }

        return new PurgeResult($expired, $purged, $apply);
    }
}
