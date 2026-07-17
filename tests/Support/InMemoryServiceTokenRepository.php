<?php

declare(strict_types=1);

namespace NeneContact\Tests\Support;

use NeneContact\ServiceToken\ServiceToken;
use NeneContact\ServiceToken\ServiceTokenNotFoundException;
use NeneContact\ServiceToken\ServiceTokenRepositoryInterface;

/**
 * In-memory service-token registry for use-case tests. Records the `revoked_at` values passed
 * to {@see revoke()} so revocation behaviour can be asserted without a database.
 */
final class InMemoryServiceTokenRepository implements ServiceTokenRepositoryInterface
{
    /** @var array<int, ServiceToken> */
    private array $rows = [];
    private int $seq = 0;

    /** @var list<string> revoked_at timestamps passed to revoke() */
    public array $revoked = [];

    public function save(ServiceToken $token): int
    {
        $id = ++$this->seq;
        $this->rows[$id] = new ServiceToken(
            id: $id,
            organizationId: $token->organizationId,
            jti: $token->jti,
            subject: $token->subject,
            label: $token->label,
            scopes: $token->scopes,
            createdBy: $token->createdBy,
            createdAt: $token->createdAt,
            expiresAt: $token->expiresAt,
            revokedAt: $token->revokedAt,
        );

        return $id;
    }

    public function findById(int $id): ?ServiceToken
    {
        return $this->rows[$id] ?? null;
    }

    public function findAll(int $limit, int $offset): array
    {
        return array_values($this->rows);
    }

    public function count(): int
    {
        return count($this->rows);
    }

    public function revoke(int $id, string $revokedAt): void
    {
        if (!isset($this->rows[$id])) {
            throw new ServiceTokenNotFoundException($id);
        }

        $existing = $this->rows[$id];
        $this->rows[$id] = new ServiceToken(
            id: $existing->id,
            organizationId: $existing->organizationId,
            jti: $existing->jti,
            subject: $existing->subject,
            label: $existing->label,
            scopes: $existing->scopes,
            createdBy: $existing->createdBy,
            createdAt: $existing->createdAt,
            expiresAt: $existing->expiresAt,
            revokedAt: $revokedAt,
        );
        $this->revoked[] = $revokedAt;
    }
}
