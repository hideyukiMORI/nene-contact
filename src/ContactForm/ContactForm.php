<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class ContactForm
{
    /**
     * @param list<string>               $locales        subset of {ja, en} (ADR 0011)
     * @param list<string>               $allowedOrigins origin allowlist (ADR 0010)
     * @param list<FormField>            $fields         ordered fields
     * @param array<string, string>|null $consentLabel   per-locale consent copy (ja/en); present when $consentRequired (charter §3)
     */
    public function __construct(
        public int $organizationId,
        public string $name,
        public string $publicFormKey,
        public string $defaultLocale,
        public array $locales,
        public array $allowedOrigins,
        public array $fields,
        public ?string $description = null,
        public string $status = 'active',
        public bool $consentRequired = false,
        public ?array $consentLabel = null,
        public ?int $retentionDays = null,
        public ?Appearance $appearance = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
