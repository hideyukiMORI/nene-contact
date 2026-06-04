<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface CorrectSubmissionUseCaseInterface
{
    /**
     * @param array<string, mixed> $values field name => corrected value (merged over the stored values)
     */
    public function execute(?int $actorUserId, int $id, array $values): Submission;
}
