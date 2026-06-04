<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Database\DatabaseQueryExecutorInterface;

/**
 * Cross-tenant purge persistence for attachments (system job; not request-scoped).
 * Erasure clears the storage key and sets purged_at — the row is never physically deleted
 * (ADR 0016).
 */
final readonly class PdoAttachmentPurgeRepository implements AttachmentPurgeRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    /** @return list<array{id: int, organization_id: int, storage_key: string}> */
    public function findErasableBySubmission(int $submissionId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT id, organization_id, storage_key FROM submission_attachments
             WHERE submission_id = ? AND storage_key IS NOT NULL AND purged_at IS NULL',
            [$submissionId],
        );

        return array_map(static fn (array $r): array => [
            'id' => (int) $r['id'],
            'organization_id' => (int) $r['organization_id'],
            'storage_key' => (string) $r['storage_key'],
        ], $rows);
    }

    /** @return list<array{id: int, organization_id: int, storage_key: string, created_at: string}> */
    public function findOrphans(): array
    {
        $rows = $this->query->fetchAll(
            'SELECT id, organization_id, storage_key, created_at FROM submission_attachments
             WHERE submission_id IS NULL AND deleted_at IS NULL AND storage_key IS NOT NULL',
            [],
        );

        return array_map(static fn (array $r): array => [
            'id' => (int) $r['id'],
            'organization_id' => (int) $r['organization_id'],
            'storage_key' => (string) $r['storage_key'],
            'created_at' => (string) $r['created_at'],
        ], $rows);
    }

    public function markPurged(int $id): void
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'UPDATE submission_attachments SET storage_key = NULL, purged_at = ?, updated_at = ? WHERE id = ?',
            [$now, $now, $id],
        );
    }

    public function markOrphanPurged(int $id): void
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'UPDATE submission_attachments SET storage_key = NULL, deleted_at = ?, purged_at = ?, updated_at = ? WHERE id = ?',
            [$now, $now, $now, $id],
        );
    }
}
