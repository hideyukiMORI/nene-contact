<?php

declare(strict_types=1);

namespace NeneContact\Tests\Organization;

use NeneContact\Organization\CreateOrganizationInput;
use NeneContact\Organization\CreateOrganizationUseCase;
use NeneContact\Organization\OrganizationSlugConflictException;
use PHPUnit\Framework\TestCase;

final class CreateOrganizationUseCaseTest extends TestCase
{
    public function test_creates_organization_and_returns_output(): void
    {
        $repo = new InMemoryOrganizationRepository();
        $useCase = new CreateOrganizationUseCase($repo);

        $output = $useCase->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        self::assertSame('Acme', $output->name);
        self::assertSame('acme', $output->slug);
        self::assertSame('free', $output->plan);
        self::assertTrue($output->isActive);
        self::assertGreaterThan(0, $output->id);
        self::assertNotNull($repo->findBySlug('acme'));
    }

    public function test_rejects_duplicate_slug(): void
    {
        $repo = new InMemoryOrganizationRepository();
        $useCase = new CreateOrganizationUseCase($repo);
        $useCase->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        $this->expectException(OrganizationSlugConflictException::class);

        $useCase->execute(new CreateOrganizationInput(name: 'Acme Two', slug: 'acme'));
    }
}
