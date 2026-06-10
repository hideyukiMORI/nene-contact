<?php

declare(strict_types=1);

namespace NeneContact\Auth;

/**
 * Maps an admin route + HTTP method to the {@see Capability} it requires.
 * Returns null when a route needs only authentication (no specific capability).
 */
final class CapabilityResolver
{
    public static function resolve(string $path, string $method): ?Capability
    {
        $method = strtoupper($method);

        if (str_starts_with($path, '/admin/organizations')) {
            return Capability::ManageOrganizations;
        }

        if (str_starts_with($path, '/admin/users')) {
            return Capability::ManageUsers;
        }

        if (str_starts_with($path, '/admin/contact-forms') || str_starts_with($path, '/admin/form-fields') || str_starts_with($path, '/admin/records')) {
            return Capability::ManageForms;
        }

        if (str_starts_with($path, '/admin/notification-channels')) {
            return Capability::ManageChannels;
        }

        if (str_starts_with($path, '/admin/settings')) {
            return Capability::ManageSettings;
        }

        if (str_starts_with($path, '/admin/submissions')) {
            return self::isMutationMethod($method) ? Capability::ManageSubmissions : Capability::ViewSubmissions;
        }

        if (str_starts_with($path, '/admin/audit-events')) {
            return Capability::ViewAuditLog;
        }

        return null;
    }

    private static function isMutationMethod(string $method): bool
    {
        return !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
    }
}
