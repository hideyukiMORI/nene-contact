<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceToken;

use Nene2\Config\DatabaseConfig;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceToken\PdoServiceTokenRepository;
use NeneContact\ServiceToken\ServiceToken;
use NeneContact\ServiceToken\ServiceTokenNotFoundException;
use PDO;
use PHPUnit\Framework\TestCase;

/**
 * Exercises the registry against a real in-memory SQLite DB (#386). Contact has no
 * schema/*.sql (phinx-only), so the table mirrors the migration inline.
 */
final class PdoServiceTokenRepositoryTest extends TestCase
{
    /** @var RequestScopedHolder<int> */
    private RequestScopedHolder $orgId;
    private PdoServiceTokenRepository $repository;
    private PDO $pdo;

    protected function setUp(): void
    {
        $factory = new PdoConnectionFactory(DatabaseConfig::sqlite(':memory:', 'test'));
        $this->pdo = $factory->create();
        $this->pdo->exec(self::SCHEMA);

        $this->orgId = new RequestScopedHolder();
        $this->orgId->set(1);
        $this->repository = new PdoServiceTokenRepository(new PdoDatabaseQueryExecutor($factory, $this->pdo), $this->orgId);
    }

    public function test_save_returns_id_and_find_round_trips(): void
    {
        $id = $this->repository->save($this->newToken('jti-a', ['ingest:submissions']));

        self::assertGreaterThan(0, $id);

        $found = $this->repository->findById($id);
        self::assertNotNull($found);
        self::assertSame('jti-a', $found->jti);
        self::assertSame('service:records', $found->subject);
        self::assertSame(['ingest:submissions'], $found->scopes);
        self::assertNull($found->revokedAt);
        self::assertFalse($found->isRevoked());
    }

    public function test_find_by_id_is_organization_scoped(): void
    {
        $id = $this->repository->save($this->newToken('jti-b'));

        $this->orgId->set(2);
        self::assertNull($this->repository->findById($id), 'a token from another org must not be visible');
    }

    public function test_find_all_is_org_scoped_newest_first(): void
    {
        $first = $this->repository->save($this->newToken('jti-1'));
        $second = $this->repository->save($this->newToken('jti-2'));

        // A token in another org must not leak into this org's listing.
        $this->orgId->set(9);
        $this->repository->save($this->newToken('jti-other'));
        $this->orgId->set(1);

        $all = $this->repository->findAll(10, 0);
        self::assertCount(2, $all);
        self::assertSame($second, $all[0]->id, 'newest first');
        self::assertSame($first, $all[1]->id);
        self::assertSame(2, $this->repository->count());
    }

    public function test_revoke_sets_timestamp_and_is_idempotent(): void
    {
        $id = $this->repository->save($this->newToken('jti-r'));

        $this->repository->revoke($id, '2026-07-17 12:00:00');
        $revoked = $this->repository->findById($id);
        self::assertNotNull($revoked);
        self::assertSame('2026-07-17 12:00:00', $revoked->revokedAt);
        self::assertTrue($revoked->isRevoked());

        // Second revoke is a no-op (row already revoked) and must not throw.
        $this->repository->revoke($id, '2026-07-17 13:00:00');
        $again = $this->repository->findById($id);
        self::assertNotNull($again);
        self::assertSame('2026-07-17 12:00:00', $again->revokedAt, 'revoke does not overwrite an existing timestamp');
    }

    public function test_revoke_unknown_id_throws(): void
    {
        $this->expectException(ServiceTokenNotFoundException::class);
        $this->repository->revoke(999, '2026-07-17 12:00:00');
    }

    public function test_revoke_is_organization_scoped(): void
    {
        $id = $this->repository->save($this->newToken('jti-x'));

        $this->orgId->set(2);
        $this->expectException(ServiceTokenNotFoundException::class);
        $this->repository->revoke($id, '2026-07-17 12:00:00');
    }

    /**
     * @param list<string> $scopes
     */
    private function newToken(string $jti, array $scopes = ['ingest:submissions']): ServiceToken
    {
        return new ServiceToken(
            id: null,
            organizationId: $this->orgId->get(),
            jti: $jti,
            subject: 'service:records',
            label: 'NeNe Records',
            scopes: $scopes,
            createdBy: 42,
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
