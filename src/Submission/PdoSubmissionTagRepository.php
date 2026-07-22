<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * SQL-backed submission-tag assignments (ADR 0019). Reads join the org's non-deleted `tags`
 * (scoped to the resolved organization, ADR 0014); one active row per (submission_id, tag_id)
 * with a soft remove (ADR 0016). SQL lives only here (backend-standards).
 */
final readonly class PdoSubmissionTagRepository implements SubmissionTagRepositoryInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId resolved organization for scoping the tag join
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function add(int $submissionId, int $tagId, string $createdAt): void
    {
        $active = $this->query->fetchOne(
            'SELECT id FROM submission_tags WHERE submission_id = ? AND tag_id = ? AND deleted_at IS NULL',
            [$submissionId, $tagId],
        );
        if ($active !== null) {
            return; // idempotent: already applied
        }

        $reactivated = $this->query->execute(
            'UPDATE submission_tags SET deleted_at = NULL, created_at = ?
             WHERE submission_id = ? AND tag_id = ? AND deleted_at IS NOT NULL',
            [$createdAt, $submissionId, $tagId],
        );
        if ($reactivated > 0) {
            return;
        }

        $this->query->execute(
            'INSERT INTO submission_tags (submission_id, tag_id, created_at, deleted_at) VALUES (?, ?, ?, NULL)',
            [$submissionId, $tagId, $createdAt],
        );
    }

    public function remove(int $submissionId, int $tagId, string $deletedAt): void
    {
        $this->query->execute(
            'UPDATE submission_tags SET deleted_at = ? WHERE submission_id = ? AND tag_id = ? AND deleted_at IS NULL',
            [$deletedAt, $submissionId, $tagId],
        );
    }

    public function findTagViewsForSubmission(int $submissionId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT t.id, t.label, t.color FROM submission_tags st
             JOIN tags t ON t.id = st.tag_id AND t.deleted_at IS NULL AND t.organization_id = ?
             WHERE st.submission_id = ? AND st.deleted_at IS NULL
             ORDER BY t.sort_order ASC, t.label ASC',
            [$this->orgId->get(), $submissionId],
        );

        return array_map(static fn (array $row): array => self::view($row), $rows);
    }

    public function findTagViewsForSubmissions(array $submissionIds): array
    {
        if ($submissionIds === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($submissionIds), '?'));
        $rows = $this->query->fetchAll(
            'SELECT st.submission_id, t.id, t.label, t.color FROM submission_tags st
             JOIN tags t ON t.id = st.tag_id AND t.deleted_at IS NULL AND t.organization_id = ?
             WHERE st.submission_id IN (' . $placeholders . ') AND st.deleted_at IS NULL
             ORDER BY t.sort_order ASC, t.label ASC',
            [$this->orgId->get(), ...$submissionIds],
        );

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[(int) $row['submission_id']][] = self::view($row);
        }

        return $grouped;
    }

    /**
     * @param array<string, mixed> $row
     * @return array{id: int, label: string, color: string}
     */
    private static function view(array $row): array
    {
        return ['id' => (int) $row['id'], 'label' => (string) $row['label'], 'color' => (string) $row['color']];
    }
}
