<?php

declare(strict_types=1);

namespace NeneContact\Tests\Support;

use NeneContact\Tag\Tag;
use NeneContact\Tag\TagNotFoundException;
use NeneContact\Tag\TagRepositoryInterface;

/**
 * In-memory tag vocabulary for use-case tests. Mirrors the SQL repository's non-deleted
 * semantics (soft-delete via `deletedAt`) so behaviour can be asserted without a database.
 */
final class InMemoryTagRepository implements TagRepositoryInterface
{
    /** @var array<int, Tag> */
    private array $rows = [];
    private int $seq = 0;

    public function save(Tag $tag): int
    {
        $id = ++$this->seq;
        $this->rows[$id] = new Tag(
            id: $id,
            organizationId: $tag->organizationId,
            label: $tag->label,
            color: $tag->color,
            sortOrder: $tag->sortOrder,
            createdAt: $tag->createdAt,
            updatedAt: $tag->updatedAt,
            deletedAt: $tag->deletedAt,
        );

        return $id;
    }

    public function findById(int $id): ?Tag
    {
        $tag = $this->rows[$id] ?? null;

        return $tag !== null && $tag->deletedAt === null ? $tag : null;
    }

    public function findAll(int $limit, int $offset): array
    {
        $active = array_values(array_filter($this->rows, static fn (Tag $t): bool => $t->deletedAt === null));
        usort($active, static fn (Tag $a, Tag $b): int => [$a->sortOrder, $a->label] <=> [$b->sortOrder, $b->label]);

        return array_slice($active, $offset, $limit);
    }

    public function count(): int
    {
        return count(array_filter($this->rows, static fn (Tag $t): bool => $t->deletedAt === null));
    }

    public function labelExists(string $label, ?int $excludeId = null): bool
    {
        foreach ($this->rows as $id => $tag) {
            if ($tag->deletedAt === null && $tag->label === $label && $id !== $excludeId) {
                return true;
            }
        }

        return false;
    }

    public function update(int $id, string $label, string $color, int $sortOrder, string $updatedAt): void
    {
        $current = $this->findById($id);
        if ($current === null) {
            throw new TagNotFoundException($id);
        }

        $this->rows[$id] = new Tag(
            id: $id,
            organizationId: $current->organizationId,
            label: $label,
            color: $color,
            sortOrder: $sortOrder,
            createdAt: $current->createdAt,
            updatedAt: $updatedAt,
            deletedAt: null,
        );
    }

    public function softDelete(int $id, string $deletedAt): void
    {
        $existing = $this->rows[$id] ?? null;
        if ($existing === null) {
            throw new TagNotFoundException($id);
        }

        if ($existing->deletedAt !== null) {
            return; // idempotent
        }

        $this->rows[$id] = new Tag(
            id: $id,
            organizationId: $existing->organizationId,
            label: $existing->label,
            color: $existing->color,
            sortOrder: $existing->sortOrder,
            createdAt: $existing->createdAt,
            updatedAt: $existing->updatedAt,
            deletedAt: $deletedAt,
        );
    }
}
