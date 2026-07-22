<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\RequestScopedHolder;

/**
 * SQL-backed tag vocabulary, scoped to the resolved organization (ADR 0014). SQL lives only
 * here (backend-standards). Uniqueness of a label per org (among non-deleted rows) is enforced
 * in {@see self::labelExists()}; physical deletion never happens (ADR 0016).
 */
final readonly class PdoTagRepository implements TagRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, label, color, sort_order, created_at, updated_at, deleted_at';

    /**
     * @param RequestScopedHolder<int> $orgId resolved organization for scoping
     */
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function save(Tag $tag): int
    {
        $this->query->execute(
            'INSERT INTO tags (organization_id, label, color, sort_order, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $this->orgId->get(),
                $tag->label,
                $tag->color,
                $tag->sortOrder,
                $tag->createdAt,
                $tag->updatedAt,
                $tag->deletedAt,
            ],
        );

        return $this->query->lastInsertId();
    }

    public function findById(int $id): ?Tag
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM tags WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$id, $this->orgId->get()],
        );

        return $row === null ? null : self::mapRow($row);
    }

    public function findAll(int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM tags WHERE organization_id = ? AND deleted_at IS NULL
             ORDER BY sort_order ASC, label ASC LIMIT ? OFFSET ?',
            [$this->orgId->get(), $limit, $offset],
        );

        return array_map(static fn (array $row): Tag => self::mapRow($row), $rows);
    }

    public function count(): int
    {
        $row = $this->query->fetchOne(
            'SELECT COUNT(*) AS total FROM tags WHERE organization_id = ? AND deleted_at IS NULL',
            [$this->orgId->get()],
        );

        return $row === null ? 0 : (int) $row['total'];
    }

    public function labelExists(string $label, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) AS total FROM tags WHERE organization_id = ? AND label = ? AND deleted_at IS NULL';
        $params = [$this->orgId->get(), $label];

        if ($excludeId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $excludeId;
        }

        $row = $this->query->fetchOne($sql, $params);

        return $row !== null && (int) $row['total'] > 0;
    }

    public function update(int $id, string $label, string $color, int $sortOrder, string $updatedAt): void
    {
        $affected = $this->query->execute(
            'UPDATE tags SET label = ?, color = ?, sort_order = ?, updated_at = ?
             WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$label, $color, $sortOrder, $updatedAt, $id, $this->orgId->get()],
        );

        if ($affected === 0 && $this->findById($id) === null) {
            throw new TagNotFoundException($id);
        }
    }

    public function softDelete(int $id, string $deletedAt): void
    {
        $affected = $this->query->execute(
            'UPDATE tags SET deleted_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
            [$deletedAt, $id, $this->orgId->get()],
        );

        if ($affected === 0) {
            // Either unknown/foreign id, or already deleted. Distinguish so re-delete is a
            // no-op 204 while a genuinely missing tag is a 404 (parity with findById excluding
            // deleted rows: a deleted row returns null, so probe the raw row instead).
            $row = $this->query->fetchOne(
                'SELECT id FROM tags WHERE id = ? AND organization_id = ?',
                [$id, $this->orgId->get()],
            );

            if ($row === null) {
                throw new TagNotFoundException($id);
            }
        }
    }

    /**
     * @param array<string, mixed> $row
     */
    private static function mapRow(array $row): Tag
    {
        return new Tag(
            id: (int) $row['id'],
            organizationId: (int) $row['organization_id'],
            label: (string) $row['label'],
            color: (string) $row['color'],
            sortOrder: (int) $row['sort_order'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
            deletedAt: $row['deleted_at'] !== null ? (string) $row['deleted_at'] : null,
        );
    }
}
