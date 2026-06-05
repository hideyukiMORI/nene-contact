<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface ListSubmissionsUseCaseInterface
{
    public function execute(SubmissionFilter $filter, int $limit, int $offset): ListSubmissionsResult;
}
