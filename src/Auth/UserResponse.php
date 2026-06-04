<?php

declare(strict_types=1);

namespace NeneContact\Auth;

/**
 * Presents a User as the admin API/JSON shape. The password hash is never
 * included, so the same array doubles as the sanitized audit snapshot (ADR 0013).
 */
final readonly class UserResponse
{
    /** @return array<string, mixed> */
    public static function toArray(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'organization_id' => $user->organizationId,
            'status' => $user->status,
            'created_at' => $user->createdAt,
            'updated_at' => $user->updatedAt,
        ];
    }
}
