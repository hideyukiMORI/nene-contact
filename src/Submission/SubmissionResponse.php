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
    /**
     * Redacted list item for the inbox: field values are **masked** (charter §11), so the
     * bulk list never discloses raw PII — full content is only on the single detail view.
     * Consent copy is omitted from the list; it belongs to the detail/disclosure path.
     *
     * @return array<string, mixed>
     */
    public static function toListItem(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'status' => $submission->status,
            'source' => $submission->source,
            'field_values' => PiiMasker::maskValues($submission->fieldValues),
            'submitted_at' => $submission->submittedAt,
        ];
    }

    /** @return array<string, mixed> */
    public static function toArray(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'contact_form_id' => $submission->contactFormId,
            'status' => $submission->status,
            'source' => $submission->source,
            // Safe reception meta shown by default (ADR 0018); IP/UA stay out of this payload.
            'source_url' => $submission->sourceUrl,
            'locale' => $submission->locale,
            'field_values' => $submission->fieldValues,
            // Consent evidence for the disclosure right (charter §3/§4); immutable once stored.
            'consent_label' => $submission->consentLabel,
            'consent_given_at' => $submission->consentGivenAt,
            'submitted_at' => $submission->submittedAt,
        ];
    }

    /**
     * Technical reception metadata (IP / User-Agent) for abuse investigation. Returned **only**
     * by the dedicated audited disclosure endpoint (ADR 0018) — never by the default detail,
     * list, MCP, or export surfaces (charter §2/§11).
     *
     * @return array<string, mixed>
     */
    public static function toTechnicalMeta(Submission $submission): array
    {
        return [
            'id' => $submission->id,
            'ip' => $submission->ip,
            'user_agent' => $submission->userAgent,
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
