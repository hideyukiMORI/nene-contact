<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use NeneContact\Audit\AuditRecorderInterface;

/**
 * Soft-deletes a contact form (ADR 0016 — never a physical row deletion). The form drops
 * out of every read immediately; previously received submissions are retained. The audit
 * trail (contact_form.deleted) proves the form existed and who removed it (ADR 0013).
 */
final readonly class DeleteContactFormUseCase implements DeleteContactFormUseCaseInterface
{
    public function __construct(
        private ContactFormRepositoryInterface $forms,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        // findById is org-scoped, so a cross-tenant id reads as not found (no existence leak).
        $before = $this->forms->findById($id);

        if ($before === null) {
            throw new ContactFormNotFoundException($id);
        }

        $this->forms->softDelete($id);

        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'contact_form.deleted',
            'contact_form',
            $id,
            ContactFormResponse::toArray($before),
            null,
        );
    }
}
