<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\Submission\Submission;

final readonly class AgentSubmissionListResult
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
