<?php

declare(strict_types=1);

namespace NeneContact\Auth;

/**
 * Authorization capabilities (multi-tenancy.md). Mapped to routes by
 * {@see CapabilityResolver} and granted per role by {@see Role::hasCapability()}.
 */
enum Capability
{
    case ManageOrganizations;
    case ManageUsers;
    case ManageForms;
    case ManageChannels;
    case ManageSettings;
    case ViewSubmissions;
    case ManageSubmissions;
    case ViewAuditLog;
}
