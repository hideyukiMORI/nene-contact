<?php

declare(strict_types=1);

namespace NeneContact\Auth;

final readonly class User
{
    public function __construct(
        public int $id,
        public string $email,
        public string $passwordHash,
        public string $role,
        public ?int $organizationId = null,
        public string $status = 'active',
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
