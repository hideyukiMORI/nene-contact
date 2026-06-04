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
            'source' => $submission->source,
            'field_values' => $submission->fieldValues,
            // Consent evidence for the disclosure right (charter §3/§4); immutable once stored.
            'consent_label' => $submission->consentLabel,
            'consent_given_at' => $submission->consentGivenAt,
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
            'source' => $submission->source,
            'field_keys' => array_keys($submission->fieldValues),
            'consent_given_at' => $submission->consentGivenAt,
        ];
    }
}
