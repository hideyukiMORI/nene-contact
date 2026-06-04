<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;

/**
 * Cross-tenant purge persistence (system job; not request-scoped). Candidate reads select
 * metadata only — no field_values_json — so retention decisions never load PII.
 */
final readonly class PdoSubmissionPurgeRepository implements SubmissionPurgeRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    /**
     * @return list<array{id: int, organization_id: int, submitted_at: string, retention_days: int}>
     */
    public function findActiveWithRetention(int $defaultRetentionDays): array
    {
        $rows = $this->query->fetchAll(
            'SELECT s.id AS id, s.organization_id AS organization_id, s.submitted_at AS submitted_at,
                    COALESCE(cf.retention_days, ?) AS retention_days
             FROM submissions s
             JOIN contact_forms cf ON cf.id = s.contact_form_id
             WHERE s.deleted_at IS NULL',
            [$defaultRetentionDays],
        );

        return array_map(static fn (array $r): array => [
            'id' => (int) $r['id'],
            'organization_id' => (int) $r['organization_id'],
            'submitted_at' => (string) $r['submitted_at'],
            'retention_days' => (int) $r['retention_days'],
        ], $rows);
    }

    /**
     * @return list<array{id: int, organization_id: int, deleted_at: string}>
     */
    public function findSoftDeleted(): array
    {
        $rows = $this->query->fetchAll(
            'SELECT id, organization_id, deleted_at FROM submissions WHERE deleted_at IS NOT NULL',
            [],
        );

        return array_map(static fn (array $r): array => [
            'id' => (int) $r['id'],
            'organization_id' => (int) $r['organization_id'],
            'deleted_at' => (string) $r['deleted_at'],
        ], $rows);
    }

    public function softDeleteById(int $id): void
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'UPDATE submissions SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
            [$now, $now, $id],
        );
    }

    public function hardDeleteById(int $id): void
    {
        $this->query->execute('DELETE FROM submissions WHERE id = ?', [$id]);
    }
}
