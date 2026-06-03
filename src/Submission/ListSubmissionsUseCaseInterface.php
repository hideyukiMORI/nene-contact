<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface ListSubmissionsUseCaseInterface
{
    public function execute(int $limit, int $offset): ListSubmissionsResult;
}
