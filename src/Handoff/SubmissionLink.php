<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

/**
 * Records the outcome of handing a submission to a sibling product over HTTP (M5, DO D11/D12).
 * One link per (submission, target); only the matching sibling-pointer field is populated.
 * Rows are created/updated only — never deleted (ADR 0016).
 */
final readonly class SubmissionLink
{
    public const TARGET_DEAL = 'deal';

    public const TARGET_VAULT = 'vault';

    public const TARGET_INVOICE = 'invoice';

    public const STATUS_PENDING = 'pending';

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_FAILED = 'failed';

    public function __construct(
        public int $organizationId,
        public int $submissionId,
        public string $target,
        public string $handoffStatus = self::STATUS_PENDING,
        public ?string $dealOpportunityId = null,
        public ?string $vaultDocumentId = null,
        public ?string $invoiceClientId = null,
        public ?string $lastError = null,
        // Per-attachment targets (Vault) carry the attachment id; submission-level targets
        // (Deal) leave it null. A submission has one link per (target, attachment_id).
        public ?int $attachmentId = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
