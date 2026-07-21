<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Notification\OrganizationMailSettingsResolver;
use NeneContact\Organization\Organization;
use NeneContact\Organization\OrganizationRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class OrganizationMailSettingsResolverTest extends TestCase
{
    private function repo(?Organization $org): OrganizationRepositoryInterface
    {
        return new class ($org) implements OrganizationRepositoryInterface {
            public function __construct(private ?Organization $org)
            {
            }

            public function findById(int $id): ?Organization
            {
                return $this->org;
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
            }
        };
    }

    private function org(?string $displayName, ?string $signature): Organization
    {
        return new Organization(
            name: 'AYANE',
            slug: 'ayane',
            plan: 'free',
            isActive: true,
            id: 7,
            senderDisplayName: $displayName,
            emailSignature: $signature,
        );
    }

    public function test_display_name_wins_over_env_and_address_is_kept(): void
    {
        // env carries a display name too, but the org's display name wins; the env address is used.
        $resolver = new OrganizationMailSettingsResolver(
            $this->repo($this->org('AYANE（自動送信）', null)),
            'Env Name <noreply@ayane.co.jp>',
        );

        $settings = $resolver->resolve(7);

        self::assertSame('AYANE（自動送信） <noreply@ayane.co.jp>', $settings->from);
        self::assertSame('', $settings->signature);
    }

    public function test_falls_back_to_org_name_when_no_display_name(): void
    {
        $resolver = new OrganizationMailSettingsResolver($this->repo($this->org(null, null)), 'noreply@ayane.co.jp');

        self::assertSame('AYANE <noreply@ayane.co.jp>', $resolver->resolve(7)->from);
    }

    public function test_unknown_org_uses_bare_address(): void
    {
        $resolver = new OrganizationMailSettingsResolver($this->repo(null), 'noreply@ayane.co.jp');

        self::assertSame('noreply@ayane.co.jp', $resolver->resolve(7)->from);
    }

    public function test_signature_is_appended_preserving_newlines(): void
    {
        $resolver = new OrganizationMailSettingsResolver($this->repo($this->org(null, "-- \nAYANE")), 'noreply@ayane.co.jp');
        $settings = $resolver->resolve(7);

        self::assertSame("body line\n\n-- \nAYANE\n", $settings->applyTo('body line'));
    }

    public function test_empty_signature_leaves_body_unchanged(): void
    {
        $resolver = new OrganizationMailSettingsResolver($this->repo($this->org(null, null)), 'noreply@ayane.co.jp');

        self::assertSame('body', $resolver->resolve(7)->applyTo('body'));
    }
}
