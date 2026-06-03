<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Presents a Submission for the admin inbox. IP / user-agent are excluded by default
 * (charter §2/§11). The audit snapshot is redacted further — field *keys* only, never
 * the submitted values — so personal data is never written to the audit trail (§10).
 */
final readonly class SubmissionResponse
{
    /** @return array<string, mixed> */
    public static function toArray(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'status' => $submission->status,
            'field_values' => $submission->fieldValues,
            'submitted_at' => $submission->submittedAt,
        ];
    }

    /**
     * Redacted snapshot for the audit trail: no raw field values (PII), no IP/UA.
     *
     * @return array<string, mixed>
     */
    public static function toAuditSnapshot(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'status' => $submission->status,
            'field_keys' => array_keys($submission->fieldValues),
        ];
    }
}
