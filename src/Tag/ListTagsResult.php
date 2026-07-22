<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Page of tags plus the total count for pagination (ADR 0019).
 */
final readonly class ListTagsResult
{
    /**
     * @param list<Tag> $items
     */
    public function __construct(
        public array $items,
        public int $total,
    ) {
    }
}
