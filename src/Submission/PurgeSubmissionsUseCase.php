<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\ClockInterface;
use NeneContact\Attachment\AttachmentPurgeRepositoryInterface;
use NeneContact\Attachment\AttachmentStorageInterface;
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
 * the row survives for the audit trail) and is audited `submission.purged`; its attachment
 * bytes are erased too (`attachment.purged`).
 *
 * Stage 3 — orphan cleanup: an uploaded-but-never-linked attachment older than
 * {@see RetentionPolicy::ORPHAN_GRACE_DAYS} is erased (`attachment.purged`).
 *
 * Audit snapshots carry no PII; deletion stays provable. With $apply = false the use case
 * only counts candidates (dry-run), so operators can preview before destruction.
 */
final readonly class PurgeSubmissionsUseCase implements PurgeSubmissionsUseCaseInterface
{
    public function __construct(
        private SubmissionPurgeRepositoryInterface $repository,
        private AttachmentPurgeRepositoryInterface $attachments,
        private AttachmentStorageInterface $storage,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
    ) {
    }

    public function execute(bool $apply): PurgeResult
    {
        $now = $this->clock->now()->getTimestamp();
        $expired = 0;
        $purged = 0;
        $attachmentsErased = 0;

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

            $erasable = $this->attachments->findErasableBySubmission($row['id']);

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

                foreach ($erasable as $attachment) {
                    $this->storage->erase($attachment['storage_key']);
                    $this->attachments->markPurged($attachment['id']);
                    $this->auditAttachmentPurged($attachment['id'], $attachment['organization_id']);
                }
            }

            $purged++;
            $attachmentsErased += count($erasable);
        }

        foreach ($this->attachments->findOrphans() as $orphan) {
            $cutoff = strtotime($orphan['created_at']) + (RetentionPolicy::ORPHAN_GRACE_DAYS * 86400);
            if ($cutoff >= $now) {
                continue;
            }

            if ($apply) {
                $this->storage->erase($orphan['storage_key']);
                $this->attachments->markOrphanPurged($orphan['id']);
                $this->auditAttachmentPurged($orphan['id'], $orphan['organization_id']);
            }

            $attachmentsErased++;
        }

        return new PurgeResult($expired, $purged, $attachmentsErased, $apply);
    }

    private function auditAttachmentPurged(int $id, int $organizationId): void
    {
        $this->audit->record(null, $organizationId, 'attachment.purged', 'attachment', $id, null, null);
    }
}
