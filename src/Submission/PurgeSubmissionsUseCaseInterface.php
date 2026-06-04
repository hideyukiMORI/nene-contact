<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface PurgeSubmissionsUseCaseInterface
{
    /** @param bool $apply when false, counts candidates without mutating (dry-run) */
    public function execute(bool $apply): PurgeResult;
}
