<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface GetSubmissionByIdUseCaseInterface
{
    public function execute(int $id): Submission;
}
