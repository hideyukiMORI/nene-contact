<?php

declare(strict_types=1);

namespace NeneContact\Api;

use LogicException;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactForm;
use NeneContact\Notification\SubmissionNotifierInterface;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Submission\SubmissionResponse;
use Throwable;

/**
 * Persists a submission ingested from a service client (concierge-ingest-contract, M6) into
 * the shared inbox. Mirrors the public submit (consent snapshot, audit, best-effort notify)
 * but carries the service `$source` and has no IP/user-agent (the visitor reached a sibling,
 * not Contact directly).
 */
final readonly class IngestSubmissionUseCase implements IngestSubmissionUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
        private SubmissionNotifierInterface $notifier,
    ) {
    }

    public function execute(ContactForm $form, array $fieldValues, string $source): Submission
    {
        if ($form->id === null) {
            throw new LogicException('Cannot ingest against an unsaved form.');
        }

        $consentLabel = $form->consentRequired ? $form->consentLabel : null;
        $consentGivenAt = $form->consentRequired ? date('Y-m-d H:i:s') : null;

        $new = new Submission(
            organizationId: $form->organizationId,
            contactFormId: $form->id,
            fieldValues: $fieldValues,
            status: 'open',
            source: $source,
            consentLabel: $consentLabel,
            consentGivenAt: $consentGivenAt,
        );

        $id = $this->submissions->create($new);

        $stored = new Submission(
            organizationId: $form->organizationId,
            contactFormId: $form->id,
            fieldValues: $fieldValues,
            status: 'open',
            source: $source,
            consentLabel: $consentLabel,
            consentGivenAt: $consentGivenAt,
            id: $id,
        );

        // Service ingest has no authenticated operator; snapshot is redacted (no PII, §10).
        $this->audit->record(
            null,
            $form->organizationId,
            'submission.created',
            'submission',
            $id,
            null,
            SubmissionResponse::toAuditSnapshot($stored),
        );

        // Best-effort: a delivery failure must never fail the ingest (charter §7).
        try {
            $this->notifier->notify($form, $stored);
        } catch (Throwable) {
            // Swallowed by design.
        }

        return $stored;
    }
}
