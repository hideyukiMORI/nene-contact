<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface DeleteSubmissionUseCaseInterface
{
    public function execute(?int $actorUserId, int $id): void;
}
