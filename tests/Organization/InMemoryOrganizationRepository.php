<?php

declare(strict_types=1);

namespace NeneContact\Tests\Organization;

use NeneContact\Organization\Organization;
use NeneContact\Organization\OrganizationNotFoundException;
use NeneContact\Organization\OrganizationRepositoryInterface;
use NeneContact\Organization\OrganizationSlugConflictException;

/**
 * In-memory test double for {@see OrganizationRepositoryInterface}. Test-only; never shipped.
 */
final class InMemoryOrganizationRepository implements OrganizationRepositoryInterface
{
    /** @var array<int, Organization> */
    private array $byId = [];

    private int $nextId = 1;

    public function findById(int $id): ?Organization
    {
        return $this->byId[$id] ?? null;
    }

    public function findBySlug(string $slug): ?Organization
    {
        foreach ($this->byId as $org) {
            if ($org->slug === $slug) {
                return $org;
            }
        }

        return null;
    }

    public function findByCustomDomain(string $domain): ?Organization
    {
        foreach ($this->byId as $org) {
            if ($org->customDomain === $domain) {
                return $org;
            }
        }

        return null;
    }

    /** @return list<Organization> */
    public function findAll(int $limit, int $offset): array
    {
        return array_slice(array_values($this->byId), $offset, $limit);
    }

    public function count(): int
    {
        return count($this->byId);
    }

    public function save(Organization $organization): int
    {
        if ($this->findBySlug($organization->slug) !== null) {
            throw new OrganizationSlugConflictException($organization->slug);
        }

        $id = $this->nextId++;
        $this->byId[$id] = new Organization(
            name: $organization->name,
            slug: $organization->slug,
            plan: $organization->plan,
            isActive: $organization->isActive,
            id: $id,
            externalId: $organization->externalId,
            customDomain: $organization->customDomain,
            createdAt: '2026-06-04 00:00:00',
            updatedAt: '2026-06-04 00:00:00',
        );

        return $id;
    }

    public function update(Organization $organization): void
    {
        if ($organization->id === null || !isset($this->byId[$organization->id])) {
            throw new OrganizationNotFoundException($organization->id ?? 0);
        }

        $this->byId[$organization->id] = $organization;
    }
}
