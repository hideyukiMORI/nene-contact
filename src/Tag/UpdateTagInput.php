<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Validated PATCH payload for editing a tag (`PATCH /admin/tags/{id}`, ADR 0019). Each field is
 * optional; a null field leaves the stored value unchanged (merged in the use case).
 */
final readonly class UpdateTagInput
{
    public function __construct(
        public ?string $label,
        public ?string $color,
        public ?int $sortOrder,
    ) {
    }
}
