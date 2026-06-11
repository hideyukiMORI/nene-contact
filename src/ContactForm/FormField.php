<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class FormField
{
    /**
     * @param array<string, string> $label   per-locale (ja/en) label
     * @param list<array<string, mixed>>|null $options for select fields (per-locale labels)
     */
    public function __construct(
        public string $fieldType,
        public string $name,
        public array $label,
        public bool $required,
        public int $sortOrder,
        public ?array $options = null,
        public ?string $placeholder = null,
        public ?int $id = null,
        public ?int $contactFormId = null,
    ) {
    }
}
