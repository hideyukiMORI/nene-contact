<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function findById(int $id): ?User;

    /** @return list<User> */
    public function listByOrganizationId(int $organizationId): array;

    public function create(
        string $email,
        string $passwordHash,
        string $role,
        ?int $organizationId = null,
    ): User;

    public function countByRole(string $role): int;

    public function update(int $id, string $role, string $status): void;

    public function delete(int $id): void;
}
