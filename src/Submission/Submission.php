<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class Submission
{
    /**
     * @param array<string, mixed> $fieldValues field name => submitted value
     */
    public function __construct(
        public int $organizationId,
        public int $contactFormId,
        public array $fieldValues,
        public string $status = 'open',
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?int $id = null,
        public ?string $submittedAt = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
