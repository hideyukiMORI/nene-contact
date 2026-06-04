<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class CreateContactFormInput
{
    /**
     * @param list<string>               $locales
     * @param list<string>               $allowedOrigins
     * @param list<FormField>            $fields
     * @param array<string, string>|null $consentLabel per-locale consent copy (ja/en)
     */
    public function __construct(
        public string $name,
        public string $defaultLocale,
        public array $locales,
        public array $allowedOrigins,
        public array $fields,
        public bool $consentRequired = false,
        public ?array $consentLabel = null,
    ) {
    }
}
