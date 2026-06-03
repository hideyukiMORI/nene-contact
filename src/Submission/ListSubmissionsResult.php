<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionsResult
{
    /** @param list<Submission> $items */
    public function __construct(
        public array $items,
        public int $total,
        public int $limit,
        public int $offset,
    ) {
    }
}
