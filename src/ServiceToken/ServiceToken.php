<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

/**
 * Registry record for an issued service token (embed 案1 / records native embed, #386).
 *
 * The token itself is a stateless HMAC JWT and is **never** stored — this row holds only
 * metadata plus the `jti` claim, which keys revocation. Reads/writes are scoped to
 * `organization_id` (ADR 0006); the CLI issuer may set `createdBy = null`. Mirrors NeNe
 * Invoice's service-token registry.
 *
 * @param list<string> $scopes registered {@see \NeneContact\ServiceApi\ServiceScope} values
 */
final readonly class ServiceToken
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public ?int $id,
        public int $organizationId,
        public string $jti,
        public string $subject,
        public string $label,
        public array $scopes,
        public ?int $createdBy,
        public string $createdAt,
        public string $expiresAt,
        public ?string $revokedAt,
    ) {
    }

    public function isRevoked(): bool
    {
        return $this->revokedAt !== null;
    }
}
