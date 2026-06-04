<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Submission\Submission;

interface IngestSubmissionUseCaseInterface
{
    /**
     * Creates a submission ingested from a service client (e.g. a Concierge scenario) into the
     * shared inbox, tagged with $source. Audited (`submission.created`) and notified like a
     * public submit. The caller (handler) has already validated the form and field values.
     *
     * @param array<string, mixed> $fieldValues schema-declared values only
     */
    public function execute(ContactForm $form, array $fieldValues, string $source): Submission;
}
