<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class CreateContactFormInput
{
    /**
     * @param list<string>               $locales
     * @param list<string>               $allowedOrigins
     * @param list<FormField>            $fields
     * @param array<string, string>|null $consentLabel   per-locale consent copy (ja/en)
     * @param array<string, string>|null $submitLabel    per-locale submit button label (ja/en)
     * @param array<string, string>|null $successMessage per-locale completion message (ja/en)
     * @param AutoReply|null             $autoReply      per-form sender auto-reply (#360)
     */
    public function __construct(
        public string $name,
        public string $defaultLocale,
        public array $locales,
        public array $allowedOrigins,
        public array $fields,
        public ?string $description = null,
        // Optional requested public key (slug); null generates a random one (create only).
        public ?string $publicFormKey = null,
        public bool $consentRequired = false,
        public ?array $consentLabel = null,
        public ?int $retentionDays = null,
        public ?Appearance $appearance = null,
        public ?array $submitLabel = null,
        public string $postSubmit = 'message',
        public ?array $successMessage = null,
        public ?string $redirectUrl = null,
        public ?AutoReply $autoReply = null,
        public ?string $adminNotificationSubject = null,
        public ?string $adminNotificationBody = null,
    ) {
    }
}
