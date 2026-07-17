<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use Nene2\Auth\TokenIssuerInterface;
use Nene2\Http\ClockInterface;
use Nene2\Http\RequestScopedHolder;
use Nene2\Http\SecureTokenHelper;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Issues a service token (#388): mints a stateless HMAC JWT and persists a registry row keyed
 * by its `jti`, so the token can later be listed and revoked. The token value itself is never
 * stored. The plaintext token is returned exactly once and never written to the audit trail
 * (only non-secret metadata is audited, ADR 0013).
 *
 * Persist-then-audit mirrors Contact's other mutating use cases (non-executor audit recorder);
 * see the records-embed contract sketch §Q4 for the known-difference vs Invoice's single-tx
 * audit and why revocation authority (revoked_at) is unaffected.
 */
final readonly class IssueServiceTokenUseCase implements IssueServiceTokenUseCaseInterface
{
    /** Bytes of entropy for the `jti` (→ 32 hex chars). */
    private const JTI_BYTES = 16;

    /**
     * @param RequestScopedHolder<int> $orgId resolved organization for this request
     */
    public function __construct(
        private TokenIssuerInterface $issuer,
        private ServiceTokenRepositoryInterface $repository,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, IssueServiceTokenInput $input): IssueServiceTokenResult
    {
        $organizationId = $this->orgId->get();
        $jti = SecureTokenHelper::generate(self::JTI_BYTES);

        $now = $this->clock->now();
        $issuedAt = $now->getTimestamp();
        $expiresAt = $issuedAt + $input->ttlSeconds;

        $plaintext = $this->issuer->issue([
            'sub' => $input->subject,
            'org' => $organizationId,
            'scopes' => $input->scopes,
            'jti' => $jti,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ]);

        $createdAt = $now->format('Y-m-d H:i:s');
        $expiresAtString = $now->modify('+' . $input->ttlSeconds . ' seconds')->format('Y-m-d H:i:s');

        $id = $this->repository->save(new ServiceToken(
            id: null,
            organizationId: $organizationId,
            jti: $jti,
            subject: $input->subject,
            label: $input->label,
            scopes: $input->scopes,
            createdBy: $actorUserId,
            createdAt: $createdAt,
            expiresAt: $expiresAtString,
            revokedAt: null,
        ));

        // Audit (ADR 0013): issuing a machine credential is security-relevant. The snapshot
        // carries only non-secret metadata — never the token or its jti.
        $this->audit->record(
            $actorUserId,
            $organizationId,
            'service_token.issued',
            'service_token',
            $id,
            null,
            ['label' => $input->label, 'subject' => $input->subject, 'scopes' => $input->scopes, 'expires_at' => $expiresAtString],
        );

        return new IssueServiceTokenResult(
            token: new ServiceToken(
                id: $id,
                organizationId: $organizationId,
                jti: $jti,
                subject: $input->subject,
                label: $input->label,
                scopes: $input->scopes,
                createdBy: $actorUserId,
                createdAt: $createdAt,
                expiresAt: $expiresAtString,
                revokedAt: null,
            ),
            plaintextToken: $plaintext,
        );
    }
}
