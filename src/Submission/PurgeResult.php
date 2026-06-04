<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class PurgeResult
{
    public function __construct(
        public int $expired,
        public int $purged,
        public bool $applied,
    ) {
    }
}
