<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Validated payload for creating a tag (`POST /admin/tags`, ADR 0019).
 */
final readonly class CreateTagInput
{
    public function __construct(
        public string $label,
        public string $color,
    ) {
    }
}
