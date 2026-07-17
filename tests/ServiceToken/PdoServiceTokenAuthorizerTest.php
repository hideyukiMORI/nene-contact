<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceToken;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceToken\PdoServiceTokenAuthorizer;
use NeneContact\ServiceToken\PdoServiceTokenRepository;
use NeneContact\ServiceToken\ServiceToken;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * The revocation check is NOT org-scoped by design (#386): the jti is globally unique and the
 * request org is derived from the token, so revocation must be checkable before org scoping is
 * trusted. Fail-closed on unknown/revoked jti.
 */
final class PdoServiceTokenAuthorizerTest extends TestCase
{
    private PdoServiceTokenAuthorizer $authorizer;
    private PdoServiceTokenRepository $repository;
    /** @var RequestScopedHolder<int> */
    private RequestScopedHolder $orgId;
    private PDO $pdo;

    protected function setUp(): void
    {
        $factory = new PdoConnectionFactory(DatabaseConfig::sqlite(':memory:', 'test'));
        $this->pdo = $factory->create();
        $this->pdo->exec(self::SCHEMA);

        $executor = new PdoDatabaseQueryExecutor($factory, $this->pdo);
        $this->orgId = new RequestScopedHolder();
        $this->orgId->set(1);
        $this->repository = new PdoServiceTokenRepository($executor, $this->orgId);
        $this->authorizer = new PdoServiceTokenAuthorizer($executor);
    }

    public function test_active_token_is_active(): void
    {
        $this->repository->save($this->token('jti-live'));

        self::assertTrue($this->authorizer->isActive('jti-live'));
    }

    public function test_unknown_jti_is_inactive(): void
    {
        self::assertFalse($this->authorizer->isActive('nope'), 'fail-closed on unknown jti');
    }

    public function test_revoked_token_is_inactive(): void
    {
        $id = $this->repository->save($this->token('jti-dead'));
        $this->repository->revoke($id, '2026-07-17 12:00:00');

        self::assertFalse($this->authorizer->isActive('jti-dead'));
    }

    public function test_is_active_ignores_org_scope(): void
    {
        $this->repository->save($this->token('jti-cross'));

        // Authorizer runs before org scoping; a different request org must not hide the row.
        $this->orgId->set(777);
        self::assertTrue($this->authorizer->isActive('jti-cross'));
    }

    private function token(string $jti): ServiceToken
    {
        return new ServiceToken(
            id: null,
            organizationId: $this->orgId->get(),
            jti: $jti,
            subject: 'service:records',
            label: 'NeNe Records',
            scopes: ['ingest:submissions'],
            createdBy: null,
            createdAt: '2026-07-17 00:00:00',
            expiresAt: '2027-07-17 00:00:00',
            revokedAt: null,
        );
    }

    private const SCHEMA = <<<'SQL'
        CREATE TABLE service_tokens (
            id              INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
            organization_id INTEGER      NOT NULL,
            jti             VARCHAR(64)  NOT NULL,
            subject         VARCHAR(255) NOT NULL,
            label           VARCHAR(255) NOT NULL,
            scopes          VARCHAR(255) NOT NULL,
            created_by      INTEGER,
            created_at      DATETIME     NOT NULL,
            expires_at      DATETIME     NOT NULL,
            revoked_at      DATETIME,
            CONSTRAINT uniq_service_tokens_jti UNIQUE (jti)
        );
        SQL;
}
