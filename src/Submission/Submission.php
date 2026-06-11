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
        // Origin of the submission: 'form' (public/embed) or a service source ('concierge',
        // 'import', 'api') set by the ingest endpoint (M6, concierge-ingest-contract).
        public string $source = 'form',
        public ?string $ip = null,
        public ?string $userAgent = null,
        // Embed host page the form was submitted from (referer). Non-PII reception meta
        // shown by default (ADR 0018); null for service ingest.
        public ?string $sourceUrl = null,
        // Locale the visitor submitted in (one of the form's locales); null when unknown.
        public ?string $locale = null,
        public ?array $consentLabel = null,
        public ?string $consentGivenAt = null,
        public ?int $id = null,
        public ?string $submittedAt = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
