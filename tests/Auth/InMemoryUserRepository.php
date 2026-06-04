<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Auth\User;
use NeneContact\Auth\UserRepositoryInterface;

final class InMemoryUserRepository implements UserRepositoryInterface
{
    /** @var array<int, User> */
    private array $users = [];

    private int $nextId = 1;

    public function seed(User $user): void
    {
        $this->users[$user->id] = $user;
        $this->nextId = max($this->nextId, $user->id + 1);
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email === $email) {
                return $user;
            }
        }

        return null;
    }

    public function findById(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    /** @return list<User> */
    public function listByOrganizationId(int $organizationId): array
    {
        $out = [];
        foreach ($this->users as $user) {
            if ($user->organizationId === $organizationId) {
                $out[] = $user;
            }
        }

        return $out;
    }

    public function create(
        string $email,
        string $passwordHash,
        string $role,
        ?int $organizationId = null,
    ): User {
        $id = $this->nextId++;
        $user = new User(
            id: $id,
            email: $email,
            passwordHash: $passwordHash,
            role: $role,
            organizationId: $organizationId,
            status: 'active',
        );
        $this->users[$id] = $user;

        return $user;
    }

    public function countByRole(string $role): int
    {
        return count(array_filter($this->users, static fn (User $u): bool => $u->role === $role));
    }

    public function update(int $id, string $role, string $status): void
    {
        $existing = $this->users[$id] ?? null;
        if ($existing === null) {
            return;
        }

        $this->users[$id] = new User(
            id: $existing->id,
            email: $existing->email,
            passwordHash: $existing->passwordHash,
            role: $role,
            organizationId: $existing->organizationId,
            status: $status,
        );
    }

    public function delete(int $id): void
    {
        unset($this->users[$id]);
    }
}
