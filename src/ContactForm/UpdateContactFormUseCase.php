<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use LogicException;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class UpdateContactFormUseCase implements UpdateContactFormUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private ContactFormRepositoryInterface $forms,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, int $id, CreateContactFormInput $input): ContactForm
    {
        $organizationId = $this->orgId->get();

        // findById is org-scoped, so a cross-tenant id reads as not found (no existence leak).
        $before = $this->forms->findById($id);
        if ($before === null) {
            throw new ContactFormNotFoundException($id);
        }

        // Editable fields are replaced; identity (id, public key, org, created_at, status)
        // is preserved — the public key never changes so existing embeds keep working.
        $updated = new ContactForm(
            organizationId: $before->organizationId,
            name: $input->name,
            publicFormKey: $before->publicFormKey,
            defaultLocale: $input->defaultLocale,
            locales: $input->locales,
            allowedOrigins: $input->allowedOrigins,
            fields: $input->fields,
            status: $before->status,
            consentRequired: $input->consentRequired,
            consentLabel: $input->consentLabel,
            retentionDays: $input->retentionDays,
            id: $before->id,
            createdAt: $before->createdAt,
        );

        $this->forms->update($updated);

        $after = $this->forms->findById($id);
        if ($after === null) {
            throw new LogicException('Contact form disappeared immediately after update.');
        }

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'contact_form.updated',
            'contact_form',
            $id,
            ContactFormResponse::toArray($before),
            ContactFormResponse::toArray($after),
        );

        return $after;
    }
}
