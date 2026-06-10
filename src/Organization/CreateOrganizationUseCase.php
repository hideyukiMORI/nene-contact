<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use NeneContact\Audit\AuditRecorderInterface;

final readonly class CreateOrganizationUseCase implements CreateOrganizationUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, CreateOrganizationInput $input): CreateOrganizationOutput
    {
        if ($this->organizations->findBySlug($input->slug) !== null) {
            throw new OrganizationSlugConflictException($input->slug);
        }

        $id = $this->organizations->save(new Organization(
            name: $input->name,
            slug: $input->slug,
            plan: $input->plan,
            isActive: $input->isActive,
            externalId: $input->externalId,
            customDomain: $input->customDomain,
        ));

        // Tenant provisioning is a mutation that must leave a trail (ADR 0013). A create
        // has no prior state, so before is null; the after snapshot carries no secrets
        // (organizations hold none). The new org is the scope of its own creation event.
        $this->audit->record(
            $actorUserId,
            $id,
            'organization.created',
            'organization',
            $id,
            null,
            [
                'name' => $input->name,
                'slug' => $input->slug,
                'plan' => $input->plan,
                'is_active' => $input->isActive,
                'external_id' => $input->externalId,
                'custom_domain' => $input->customDomain,
            ],
        );

        return new CreateOrganizationOutput(
            id: $id,
            name: $input->name,
            slug: $input->slug,
            plan: $input->plan,
            isActive: $input->isActive,
            externalId: $input->externalId,
            customDomain: $input->customDomain,
        );
    }
}
