<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class ListSubmissionsResult
{
    /**
     * @param list<Submission>     $items
     * @param array<string, int>   $statusCounts per-status totals for the query (status filter ignored)
     * @param array<int, list<array{id: int, label: string, color: string}>> $tagsBySubmission active tag views keyed by submission id (ADR 0019)
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $limit,
        public int $offset,
        public array $statusCounts = [],
        public array $tagsBySubmission = [],
    ) {
    }
}
