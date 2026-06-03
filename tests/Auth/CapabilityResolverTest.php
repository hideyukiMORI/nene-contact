<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Auth\Capability;
use NeneContact\Auth\CapabilityResolver;
use PHPUnit\Framework\TestCase;

final class CapabilityResolverTest extends TestCase
{
    public function test_maps_admin_routes_to_capabilities(): void
    {
        self::assertSame(Capability::ManageOrganizations, CapabilityResolver::resolve('/admin/organizations', 'POST'));
        self::assertSame(Capability::ManageUsers, CapabilityResolver::resolve('/admin/users', 'GET'));
        self::assertSame(Capability::ManageForms, CapabilityResolver::resolve('/admin/contact-forms', 'PATCH'));
        self::assertSame(Capability::ManageChannels, CapabilityResolver::resolve('/admin/notification-channels', 'POST'));
        self::assertSame(Capability::ManageSettings, CapabilityResolver::resolve('/admin/settings', 'PUT'));
    }

    public function test_submissions_read_vs_write(): void
    {
        self::assertSame(Capability::ViewSubmissions, CapabilityResolver::resolve('/admin/submissions', 'GET'));
        self::assertSame(Capability::ManageSubmissions, CapabilityResolver::resolve('/admin/submissions/1', 'PATCH'));
    }

    public function test_unmapped_route_requires_no_capability(): void
    {
        self::assertNull(CapabilityResolver::resolve('/admin/auth/login', 'POST'));
    }
}
