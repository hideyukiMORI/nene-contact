<?php

declare(strict_types=1);

namespace NeneContact\Tests\Api;

use NeneContact\Api\IngestSubmissionUseCaseInterface;
use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;

/**
 * Test double for the ingest use case: records what the handler resolved and passed down, so a
 * test can assert that both identifier routes converge on the same resolved form (and that a
 * rejected request never reaches the use case at all — `$form` stays null).
 */
final class RecordingIngestSubmissionUseCase implements IngestSubmissionUseCaseInterface
{
    public ?ContactForm $form = null;

    /** @var array<string, mixed> */
    public array $values = [];

    public ?string $source = null;

    /** @param array<string, mixed> $fieldValues */
    public function execute(ContactForm $form, array $fieldValues, string $source): Submission
    {
        $this->form = $form;
        $this->values = $fieldValues;
        $this->source = $source;

        return new Submission(
            organizationId: $form->organizationId,
            contactFormId: (int) $form->id,
            fieldValues: $fieldValues,
            status: 'open',
            source: $source,
            id: 99,
        );
    }
}
