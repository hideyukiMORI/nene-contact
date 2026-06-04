<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Upstream\InvoiceClientInterface;
use NeneContact\Upstream\UpstreamRequestException;

/**
 * Hands a triaged submission to NeNe Invoice as a draft client (M6, invoice-handoff-contract).
 * Idempotent via `external_reference = submission_id`; the same operator action is the retry
 * path. Failures are non-destructive (recorded as `failed`, submission untouched) and always
 * audited (ADR 0013): `handoff.created` on the first attempt, `handoff.retried` thereafter.
 */
final readonly class HandoffToInvoiceUseCase implements HandoffToInvoiceUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private ContactFormRepositoryInterface $forms,
        private SubmissionLinkRepositoryInterface $links,
        private InvoiceClientInterface $invoice,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $submissionId): SubmissionLink
    {
        $submission = $this->submissions->findById($submissionId);

        if ($submission === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        $existing = $this->links->findBySubmissionAndTarget($submissionId, SubmissionLink::TARGET_INVOICE);

        $form = $this->forms->findById($submission->contactFormId);
        $payload = [
            'source' => 'nene-contact',
            'contact_form_id' => $submission->contactFormId,
            'contact_form_name' => $form?->name,
            'submitted_at' => $submission->submittedAt,
            'fields' => $submission->fieldValues,
        ];

        try {
            $clientId = $this->invoice->createDraftClient((string) $submissionId, $payload);

            $link = new SubmissionLink(
                organizationId: $submission->organizationId,
                submissionId: $submissionId,
                target: SubmissionLink::TARGET_INVOICE,
                handoffStatus: SubmissionLink::STATUS_SUCCEEDED,
                invoiceClientId: $clientId,
                lastError: null,
                id: $existing?->id,
            );
        } catch (UpstreamRequestException $e) {
            // Non-destructive: the submission stays intact; record the failure for retry.
            $link = new SubmissionLink(
                organizationId: $submission->organizationId,
                submissionId: $submissionId,
                target: SubmissionLink::TARGET_INVOICE,
                handoffStatus: SubmissionLink::STATUS_FAILED,
                invoiceClientId: $existing?->invoiceClientId,
                lastError: $e->getMessage(),
                id: $existing?->id,
            );
        }

        $id = $this->links->save($link);
        $saved = new SubmissionLink(
            organizationId: $link->organizationId,
            submissionId: $link->submissionId,
            target: $link->target,
            handoffStatus: $link->handoffStatus,
            dealOpportunityId: $link->dealOpportunityId,
            vaultDocumentId: $link->vaultDocumentId,
            invoiceClientId: $link->invoiceClientId,
            lastError: $link->lastError,
            id: $id,
        );

        $this->audit->record(
            $actorUserId,
            $submission->organizationId,
            $existing === null ? 'handoff.created' : 'handoff.retried',
            'handoff',
            $submissionId,
            $existing !== null ? SubmissionLinkResponse::toAuditSnapshot($existing) : null,
            SubmissionLinkResponse::toAuditSnapshot($saved),
        );

        return $saved;
    }
}
