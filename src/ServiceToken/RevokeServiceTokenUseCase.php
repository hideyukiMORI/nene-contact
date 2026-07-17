<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use Nene2\Http\ClockInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Revokes a service token by id (org-scoped, #388). Sets `revoked_at` so the request-time
 * {@see ServiceTokenAuthorizerInterface} rejects it immediately. The revoke runs first (and
 * throws {@see ServiceTokenNotFoundException} for an unknown/foreign id, so no audit is written
 * for a non-event); the audit record follows (ADR 0013, Contact's persist-then-audit model).
 */
final readonly class RevokeServiceTokenUseCase implements RevokeServiceTokenUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId resolved organization for this request
     */
    public function __construct(
        private ServiceTokenRepositoryInterface $repository,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        $organizationId = $this->orgId->get();
        $revokedAt = $this->clock->now()->format('Y-m-d H:i:s');

        // Throws ServiceTokenNotFoundException for an unknown / foreign id (no audit for a
        // non-event). Idempotent for an already-revoked token (repository no-op).
        $this->repository->revoke($id, $revokedAt);

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'service_token.revoked',
            'service_token',
            $id,
            null,
            ['revoked_at' => $revokedAt],
        );
    }
}
