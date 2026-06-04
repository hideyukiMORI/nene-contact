<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

/**
 * Presents a SubmissionLink for the admin API. Sibling pointer ids and status are operator
 * metadata (no visitor PII). The audit snapshot carries the same ids — no secrets (§10).
 */
final readonly class SubmissionLinkResponse
{
    /** @return array<string, mixed> */
    public static function toArray(SubmissionLink $link): array
    {
        return [
            'id' => $link->id,
            'submission_id' => $link->submissionId,
            'target' => $link->target,
            'handoff_status' => $link->handoffStatus,
            'deal_opportunity_id' => $link->dealOpportunityId,
            'vault_document_id' => $link->vaultDocumentId,
            'invoice_client_id' => $link->invoiceClientId,
            'last_error' => $link->lastError,
            'created_at' => $link->createdAt,
            'updated_at' => $link->updatedAt,
        ];
    }

    /**
     * Redacted snapshot for the audit trail: ids + status only, no visitor PII (§10).
     *
     * @return array<string, mixed>
     */
    public static function toAuditSnapshot(SubmissionLink $link): array
    {
        return [
            'id' => $link->id,
            'submission_id' => $link->submissionId,
            'target' => $link->target,
            'handoff_status' => $link->handoffStatus,
            'deal_opportunity_id' => $link->dealOpportunityId,
            'vault_document_id' => $link->vaultDocumentId,
            'invoice_client_id' => $link->invoiceClientId,
        ];
    }
}
