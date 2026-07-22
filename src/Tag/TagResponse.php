<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Serialises a tag for the admin API (ADR 0019).
 */
final class TagResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(Tag $tag): array
    {
        return [
            'id' => $tag->id,
            'label' => $tag->label,
            'color' => $tag->color,
            'sort_order' => $tag->sortOrder,
            'created_at' => $tag->createdAt,
            'updated_at' => $tag->updatedAt,
        ];
    }
}
