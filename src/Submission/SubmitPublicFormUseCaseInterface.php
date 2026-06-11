<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\ContactForm\ContactForm;

interface SubmitPublicFormUseCaseInterface
{
    /**
     * @param array<string, mixed> $fieldValues
     */
    public function execute(ContactForm $form, array $fieldValues, ?string $ip, ?string $userAgent, ?string $sourceUrl = null): Submission;
}
