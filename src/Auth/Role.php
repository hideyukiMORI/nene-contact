<?php

declare(strict_types=1);

namespace NeneContact\Auth;

/**
 * Operator roles (ADR 0006). superadmin is cross-tenant; admin and editor are
 * scoped to one organization. Capability grants per {@see multi-tenancy.md}.
 */
enum Role: string
{
    case Superadmin = 'superadmin';
    case Admin = 'admin';
    case Editor = 'editor';

    public function hasCapability(Capability $capability): bool
    {
        return match ($this) {
            self::Superadmin => true,
            self::Admin => $capability !== Capability::ManageOrganizations,
            self::Editor => match ($capability) {
                Capability::ViewSubmissions,
                Capability::ManageSubmissions => true,
                Capability::ManageOrganizations,
                Capability::ManageUsers,
                Capability::ManageForms,
                Capability::ManageChannels,
                Capability::ManageSettings,
                Capability::ViewAuditLog => false,
            },
        };
    }
}
