<?php

declare(strict_types=1);

namespace NeneContact\Submission;

final readonly class Submission
{
    /**
     * @param array<string, mixed>       $fieldValues  field name => submitted value
     * @param array<string, string>|null $consentLabel immutable snapshot of the consent copy in force at submit (charter §3)
     */
    public function __construct(
        public int $organizationId,
        public int $contactFormId,
        public array $fieldValues,
        public string $status = 'open',
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?array $consentLabel = null,
        public ?string $consentGivenAt = null,
        public ?int $id = null,
        public ?string $submittedAt = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
