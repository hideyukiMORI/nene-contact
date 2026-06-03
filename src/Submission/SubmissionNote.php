<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class SubmissionNote
{
    public function __construct(
        public int $organizationId,
        public int $submissionId,
        public string $body,
        public ?int $authorUserId = null,
        public ?int $id = null,
        public ?string $createdAt = null,
    ) {
    }
}
