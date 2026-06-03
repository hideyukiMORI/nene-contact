<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface UpdateSubmissionStatusUseCaseInterface
{
    public function execute(?int $actorUserId, int $id, string $status): Submission;
}
