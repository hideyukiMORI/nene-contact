<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

/**
 * Cross-tenant access for the retention purge job (ADR 0016): erase attachment bytes in
 * place, keeping the row + audit linkage. Reads return only metadata + storage keys.
 */
interface AttachmentPurgeRepositoryInterface
{
    /**
     * Attachments of a submission that still hold bytes (for erasure when the submission is purged).
     *
     * @return list<array{id: int, organization_id: int, storage_key: string}>
     */
    public function findErasableBySubmission(int $submissionId): array;

    /**
     * Pending (unlinked, not deleted) uploads — candidates for orphan cleanup.
     *
     * @return list<array{id: int, organization_id: int, storage_key: string, created_at: string}>
     */
    public function findOrphans(): array;

    /** Erase in place: clear storage_key, set purged_at (row + metadata survive). */
    public function markPurged(int $id): void;

    /** Orphan erase: soft-delete + erase in place (storage_key cleared, deleted_at + purged_at set). */
    public function markOrphanPurged(int $id): void;
}
