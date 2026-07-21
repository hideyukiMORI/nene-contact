<?php

declare(strict_types=1);

namespace NeneContact\Tests\Organization;

use NeneContact\Audit\AuditEvent;
use NeneContact\Audit\AuditEventRepositoryInterface;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Organization\Organization;
use NeneContact\Organization\OrganizationNotFoundException;
use NeneContact\Organization\OrganizationRepositoryInterface;
use NeneContact\Organization\UpdateOrganizationInput;
use NeneContact\Organization\UpdateOrganizationUseCase;
use PHPUnit\Framework\TestCase;

final class UpdateOrganizationUseCaseTest extends TestCase
{
    private function repoWithOrg(?Organization $org): OrganizationRepositoryInterface
    {
        return new class ($org) implements OrganizationRepositoryInterface {
            public function __construct(private ?Organization $org)
            {
            }

            public function findById(int $id): ?Organization
            {
                return $this->org !== null && $this->org->id === $id ? $this->org : null;
            }

            public function findBySlug(string $slug): ?Organization
            {
                return null;
            }

            public function findByCustomDomain(string $domain): ?Organization
            {
                return null;
            }

            /** @return list<Organization> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }

            public function save(Organization $organization): int
            {
                return 0;
            }

            public function update(Organization $organization): void
            {
                $this->org = $organization;
            }
        };
    }

    /** @return object{events: list<AuditEvent>}&AuditEventRepositoryInterface */
    private function auditRepo(): AuditEventRepositoryInterface
    {
        return new class () implements AuditEventRepositoryInterface {
            /** @var list<AuditEvent> */
            public array $events = [];

            public function append(AuditEvent $event): int
            {
                $this->events[] = $event;

                return count($this->events);
            }

            /** @return list<AuditEvent> */
            public function findAll(int $limit, int $offset): array
            {
                return $this->events;
            }

            public function count(): int
            {
                return count($this->events);
            }
        };
    }

    private function org(): Organization
    {
        return new Organization(
            name: 'AYANE',
            slug: 'ayane',
            plan: 'free',
            isActive: true,
            id: 7,
            senderDisplayName: null,
            createdAt: '2026-07-21 00:00:00',
            updatedAt: '2026-07-21 00:00:00',
        );
    }

    public function test_updates_sender_display_name_and_audits(): void
    {
        $repo = $this->repoWithOrg($this->org());
        $audit = $this->auditRepo();

        $useCase = new UpdateOrganizationUseCase($repo, new AuditRecorder($audit));
        $result = $useCase->execute(5, 7, new UpdateOrganizationInput('AYANE（自動送信）', null));

        self::assertSame('AYANE（自動送信）', $result->senderDisplayName);
        self::assertSame('AYANE（自動送信）', $repo->findById(7)?->senderDisplayName);

        self::assertCount(1, $audit->events);
        self::assertSame('organization.updated', $audit->events[0]->action);
        self::assertSame(7, $audit->events[0]->organizationId);
        $before = $audit->events[0]->before;
        self::assertIsArray($before);
        self::assertArrayHasKey('sender_display_name', $before);
        self::assertNull($before['sender_display_name']);
        self::assertSame('AYANE（自動送信）', $audit->events[0]->after['sender_display_name'] ?? null);
    }

    public function test_blank_clears_the_display_name(): void
    {
        $withName = new Organization(
            name: 'AYANE',
            slug: 'ayane',
            plan: 'free',
            isActive: true,
            id: 7,
            senderDisplayName: 'Old Name',
        );
        $repo = $this->repoWithOrg($withName);

        $useCase = new UpdateOrganizationUseCase($repo, new AuditRecorder($this->auditRepo()));
        $result = $useCase->execute(5, 7, new UpdateOrganizationInput(null, null));

        self::assertNull($result->senderDisplayName);
    }

    public function test_null_caller_org_is_not_found(): void
    {
        // A principal with no organization scope (e.g. a superadmin token with org_id null)
        // has no own org to edit via this self-scoped settings surface.
        $repo = $this->repoWithOrg($this->org());

        $useCase = new UpdateOrganizationUseCase($repo, new AuditRecorder($this->auditRepo()));

        $this->expectException(OrganizationNotFoundException::class);
        $useCase->execute(5, null, new UpdateOrganizationInput('x', null));
    }

    public function test_missing_org_is_not_found(): void
    {
        $repo = $this->repoWithOrg(null);

        $useCase = new UpdateOrganizationUseCase($repo, new AuditRecorder($this->auditRepo()));

        $this->expectException(OrganizationNotFoundException::class);
        $useCase->execute(5, 7, new UpdateOrganizationInput('x', null));
    }
}
