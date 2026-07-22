<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Persistence for the org tag vocabulary (ADR 0019). Every query is scoped to the organization
 * held in the request-scoped org holder (ADR 0014). No physical deletion — retirement is a
 * soft delete (ADR 0016).
 */
interface TagRepositoryInterface
{
    public function save(Tag $tag): int;

    public function findById(int $id): ?Tag;

    /** @return list<Tag> non-deleted, ordered by sort_order then label */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;

    /**
     * True when a non-deleted tag with this label already exists in the org. When
     * $excludeId is given (rename), that row is ignored.
     */
    public function labelExists(string $label, ?int $excludeId = null): bool;

    /**
     * Applies the label/color/sort_order edit at the given timestamp.
     *
     * @throws TagNotFoundException when no matching non-deleted tag exists in the org
     */
    public function update(int $id, string $label, string $color, int $sortOrder, string $updatedAt): void;

    /**
     * Soft-deletes the tag. Idempotent: a no-op when already deleted.
     *
     * @throws TagNotFoundException when no matching tag exists in the org
     */
    public function softDelete(int $id, string $deletedAt): void;
}
