<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Auth\Capability;
use NeneContact\Auth\Role;
use PHPUnit\Framework\TestCase;

final class RoleTest extends TestCase
{
    public function test_superadmin_has_every_capability(): void
    {
        foreach (Capability::cases() as $capability) {
            self::assertTrue(Role::Superadmin->hasCapability($capability));
        }
    }

    public function test_admin_has_all_except_manage_organizations(): void
    {
        self::assertFalse(Role::Admin->hasCapability(Capability::ManageOrganizations));
        self::assertTrue(Role::Admin->hasCapability(Capability::ManageForms));
        self::assertTrue(Role::Admin->hasCapability(Capability::ManageUsers));
        self::assertTrue(Role::Admin->hasCapability(Capability::ManageSubmissions));
        self::assertTrue(Role::Admin->hasCapability(Capability::ViewAuditLog));
    }

    public function test_editor_can_only_operate_submissions(): void
    {
        self::assertTrue(Role::Editor->hasCapability(Capability::ViewSubmissions));
        self::assertTrue(Role::Editor->hasCapability(Capability::ManageSubmissions));
        self::assertFalse(Role::Editor->hasCapability(Capability::ManageForms));
        self::assertFalse(Role::Editor->hasCapability(Capability::ManageOrganizations));
        self::assertFalse(Role::Editor->hasCapability(Capability::ManageUsers));
        self::assertFalse(Role::Editor->hasCapability(Capability::ViewAuditLog));
    }
}
