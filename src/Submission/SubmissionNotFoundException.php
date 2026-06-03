<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use RuntimeException;

final class SubmissionNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Submission {$id} not found.");
    }
}
