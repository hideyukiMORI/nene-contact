<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * An org-managed tag in the vocabulary applied to submissions for triage (ADR 0019).
 *
 * Orthogonal to {@see \NeneContact\Submission\Submission}::$status: a submission has one status
 * and zero or more tags. Reads/writes are scoped to `organization_id` (ADR 0014); retirement is
 * soft (`deletedAt`, ADR 0016). The label is operator-internal metadata (single string, never
 * visitor-facing); the colour is one of the fixed {@see TagColor} tokens.
 */
final readonly class Tag
{
    public function __construct(
        public ?int $id,
        public int $organizationId,
        public string $label,
        public string $color,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?string $deletedAt,
    ) {
    }
}
