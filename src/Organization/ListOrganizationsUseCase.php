<?php

declare(strict_types=1);

namespace NeneContact\Organization;

final readonly class ListOrganizationsUseCase implements ListOrganizationsUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(ListOrganizationsInput $input): ListOrganizationsOutput
    {
        $items = array_map(
            static fn (Organization $o): ListOrganizationItem => new ListOrganizationItem(
                id: (int) $o->id,
                name: $o->name,
                slug: $o->slug,
                plan: $o->plan,
                isActive: $o->isActive,
                externalId: $o->externalId,
                customDomain: $o->customDomain,
                createdAt: $o->createdAt,
                updatedAt: $o->updatedAt,
            ),
            $this->organizations->findAll($input->limit, $input->offset),
        );

        return new ListOrganizationsOutput(
            items: $items,
            total: $this->organizations->count(),
            limit: $input->limit,
            offset: $input->offset,
        );
    }
}
