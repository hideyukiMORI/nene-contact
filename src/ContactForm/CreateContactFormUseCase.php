<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use LogicException;
use Nene2\Http\RequestScopedHolder;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class CreateContactFormUseCase implements CreateContactFormUseCaseInterface
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

    public function execute(?int $actorUserId, CreateContactFormInput $input): ContactForm
    {
        $organizationId = $this->orgId->get();

        // A custom slug must be globally unique (the public URL is shared across tenants); an
        // omitted one gets a random, collision-free key.
        if ($input->publicFormKey !== null && $this->forms->publicFormKeyExists($input->publicFormKey)) {
            throw new ValidationException([
                new ValidationError('public_form_key', 'This public key is already taken.', 'taken'),
            ]);
        }

        $form = new ContactForm(
            organizationId: $organizationId,
            name: $input->name,
            publicFormKey: $input->publicFormKey ?? bin2hex(random_bytes(16)),
            defaultLocale: $input->defaultLocale,
            locales: $input->locales,
            allowedOrigins: $input->allowedOrigins,
            fields: $input->fields,
            description: $input->description,
            status: 'active',
            consentRequired: $input->consentRequired,
            consentLabel: $input->consentLabel,
            retentionDays: $input->retentionDays,
        );

        $id = $this->forms->save($form);

        $created = $this->forms->findById($id);

        if ($created === null) {
            throw new LogicException('Contact form disappeared immediately after creation.');
        }

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'contact_form.created',
            'contact_form',
            $id,
            null,
            ContactFormResponse::toArray($created),
        );

        return $created;
    }
}
