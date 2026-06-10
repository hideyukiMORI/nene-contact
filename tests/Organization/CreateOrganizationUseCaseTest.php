<?php

declare(strict_types=1);

namespace NeneContact\Tests\Organization;

use NeneContact\Audit\AuditRecorder;
use NeneContact\Organization\CreateOrganizationInput;
use NeneContact\Organization\CreateOrganizationUseCase;
use NeneContact\Organization\OrganizationSlugConflictException;
use NeneContact\Tests\Auth\InMemoryAuditEventRepository;
use PHPUnit\Framework\TestCase;

final class CreateOrganizationUseCaseTest extends TestCase
{
    public function test_creates_organization_and_records_audit(): void
    {
        $repo = new InMemoryOrganizationRepository();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new CreateOrganizationUseCase($repo, new AuditRecorder($audit));

        $output = $useCase->execute(42, new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        self::assertSame('Acme', $output->name);
        self::assertSame('acme', $output->slug);
        self::assertSame('free', $output->plan);
        self::assertTrue($output->isActive);
        self::assertGreaterThan(0, $output->id);
        self::assertNotNull($repo->findBySlug('acme'));

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('organization.created', $event->action);
        self::assertSame('organization', $event->entityType);
        self::assertSame(42, $event->actorUserId);
        self::assertSame($output->id, $event->entityId);
        self::assertSame($output->id, $event->organizationId);
        self::assertNull($event->before);
        self::assertSame('acme', $event->after['slug'] ?? null);
    }

    public function test_rejects_duplicate_slug(): void
    {
        $repo = new InMemoryOrganizationRepository();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new CreateOrganizationUseCase($repo, new AuditRecorder($audit));
        $useCase->execute(null, new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        $this->expectException(OrganizationSlugConflictException::class);

        $useCase->execute(null, new CreateOrganizationInput(name: 'Acme Two', slug: 'acme'));
    }
}
