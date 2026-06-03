<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use LogicException;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactForm;

final readonly class SubmitPublicFormUseCase implements SubmitPublicFormUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
    ) {
    }

    /**
     * @param array<string, mixed> $fieldValues
     */
    public function execute(ContactForm $form, array $fieldValues, ?string $ip, ?string $userAgent): Submission
    {
        if ($form->id === null) {
            throw new LogicException('Cannot submit against an unsaved form.');
        }

        $id = $this->submissions->create(new Submission(
            organizationId: $form->organizationId,
            contactFormId: $form->id,
            fieldValues: $fieldValues,
            status: 'open',
            ip: $ip,
            userAgent: $userAgent,
        ));

        $stored = new Submission(
            organizationId: $form->organizationId,
            contactFormId: $form->id,
            fieldValues: $fieldValues,
            status: 'open',
            ip: $ip,
            userAgent: $userAgent,
            id: $id,
        );

        // Public submit has no authenticated actor; snapshot is redacted (no PII, §10).
        $this->audit->record(
            null,
            $form->organizationId,
            'submission.created',
            'submission',
            $id,
            null,
            SubmissionResponse::toAuditSnapshot($stored),
        );

        return $stored;
    }
}
