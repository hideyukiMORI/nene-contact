<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use NeneContact\Attachment\AttachmentNotFoundException;
use NeneContact\Attachment\AttachmentRepositoryInterface;
use NeneContact\Attachment\AttachmentStorageInterface;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Upstream\UpstreamRequestException;
use NeneContact\Upstream\VaultClientInterface;

/**
 * Archives a submission attachment in NeNe Vault as a received document (M5, DO D12).
 * Idempotent via `external_reference` per attachment; the same operator action is the retry
 * path. Failures are non-destructive (recorded as `failed`, attachment untouched) and always
 * audited (ADR 0013): `handoff.created` on the first attempt, `handoff.retried` thereafter.
 */
final readonly class HandoffAttachmentToVaultUseCase implements HandoffAttachmentToVaultUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AttachmentRepositoryInterface $attachments,
        private AttachmentStorageInterface $storage,
        private SubmissionLinkRepositoryInterface $links,
        private VaultClientInterface $vault,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $submissionId, int $attachmentId): SubmissionLink
    {
        $submission = $this->submissions->findById($submissionId);

        if ($submission === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        $attachment = $this->attachments->findForDownload($attachmentId, $submissionId);

        if ($attachment === null || $attachment->storageKey === null) {
            throw new AttachmentNotFoundException($attachmentId);
        }

        $existing = $this->links->findBySubmissionTargetAttachment($submissionId, SubmissionLink::TARGET_VAULT, $attachmentId);

        $externalReference = 'contact-submission-' . $submissionId . '-attachment-' . $attachmentId;

        try {
            $bytes = $this->storage->get($attachment->storageKey);
            if ($bytes === null) {
                throw new UpstreamRequestException('Attachment bytes are missing from storage; cannot archive to Vault.');
            }

            $documentId = $this->vault->archiveDocument(
                $externalReference,
                $attachment->originalFilename,
                $attachment->contentType,
                $bytes,
                [
                    'source' => 'nene-contact',
                    'submission_id' => $submissionId,
                    'contact_form_id' => $attachment->contactFormId,
                    'field_name' => $attachment->fieldName,
                ],
            );

            $link = new SubmissionLink(
                organizationId: $submission->organizationId,
                submissionId: $submissionId,
                target: SubmissionLink::TARGET_VAULT,
                handoffStatus: SubmissionLink::STATUS_SUCCEEDED,
                vaultDocumentId: $documentId,
                lastError: null,
                attachmentId: $attachmentId,
                id: $existing?->id,
            );
        } catch (UpstreamRequestException $e) {
            // Non-destructive: the attachment stays intact; record the failure for retry.
            $link = new SubmissionLink(
                organizationId: $submission->organizationId,
                submissionId: $submissionId,
                target: SubmissionLink::TARGET_VAULT,
                handoffStatus: SubmissionLink::STATUS_FAILED,
                vaultDocumentId: $existing?->vaultDocumentId,
                lastError: $e->getMessage(),
                attachmentId: $attachmentId,
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
            attachmentId: $link->attachmentId,
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
