<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoUserRepository implements UserRepositoryInterface
{
    private const COLUMNS = 'id, email, password_hash, role, organization_id, status, created_at, updated_at';

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findByEmail(string $email): ?User
    {
        $row = $this->query->fetchOne('SELECT ' . self::COLUMNS . ' FROM users WHERE email = ?', [$email]);

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function findById(int $id): ?User
    {
        $row = $this->query->fetchOne('SELECT ' . self::COLUMNS . ' FROM users WHERE id = ?', [$id]);

        return $row !== null ? $this->mapRow($row) : null;
    }

    /** @return list<User> */
    public function listByOrganizationId(int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM users WHERE organization_id = ? ORDER BY id ASC',
            [$organizationId],
        );

        return array_map(fn (array $row): User => $this->mapRow($row), $rows);
    }

    public function create(
        string $email,
        string $passwordHash,
        string $role,
        ?int $organizationId = null,
    ): User {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'INSERT INTO users (email, password_hash, role, organization_id, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$email, $passwordHash, $role, $organizationId, 'active', $now, $now],
        );

        $user = $this->findByEmail($email);
        assert($user !== null);

        return $user;
    }

    public function countByRole(string $role): int
    {
        $row = $this->query->fetchOne('SELECT COUNT(*) AS cnt FROM users WHERE role = ?', [$role]);

        return $row !== null ? (int) $row['cnt'] : 0;
    }

    public function delete(int $id): void
    {
        $this->query->execute('DELETE FROM users WHERE id = ?', [$id]);
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): User
    {
        return new User(
            id: (int) $row['id'],
            email: (string) $row['email'],
            passwordHash: (string) $row['password_hash'],
            role: (string) $row['role'],
            organizationId: isset($row['organization_id']) ? (int) $row['organization_id'] : null,
            status: (string) ($row['status'] ?? 'active'),
            createdAt: isset($row['created_at']) ? (string) $row['created_at'] : null,
            updatedAt: isset($row['updated_at']) ? (string) $row['updated_at'] : null,
        );
    }
}
