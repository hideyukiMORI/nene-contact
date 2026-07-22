<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * A submission plus its active tag views, for the admin detail read (ADR 0019).
 */
final readonly class SubmissionWithTags
{
    /**
     * @param list<array{id: int, label: string, color: string}> $tags
     */
    public function __construct(
        public Submission $submission,
        public array $tags,
    ) {
    }
}
