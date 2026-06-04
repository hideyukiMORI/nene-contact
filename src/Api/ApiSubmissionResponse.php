<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\Submission\Submission;

/**
 * Presents a Submission for the agent read surface (charter §11). IP / user-agent are never
 * included. Field values are masked unless `$includePii` is true (the explicit, audit-logged
 * path); `pii_included` echoes which mode produced the payload.
 */
final readonly class ApiSubmissionResponse
{
    /** @return array<string, mixed> */
    public static function toArray(Submission $submission, bool $includePii): array
    {
        return [
            'id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'status' => $submission->status,
            'source' => $submission->source,
            'pii_included' => $includePii,
            'field_values' => $includePii
                ? $submission->fieldValues
                : PiiMasker::maskValues($submission->fieldValues),
            'consent_given_at' => $submission->consentGivenAt,
            'submitted_at' => $submission->submittedAt,
        ];
    }
}
