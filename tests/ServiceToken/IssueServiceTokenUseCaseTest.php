<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceToken;

use Nene2\Auth\TokenIssuerInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceToken\IssueServiceTokenInput;
use NeneContact\ServiceToken\IssueServiceTokenUseCase;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemoryServiceTokenRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class IssueServiceTokenUseCaseTest extends TestCase
{
    public function test_mints_jwt_persists_registry_row_and_audits(): void
    {
        $issuer = new class () implements TokenIssuerInterface {
            /** @var array<string, mixed> */
            public array $capture = [];

            public function issue(array $claims): string
            {
                $this->capture = $claims;

                return 'plaintext.jwt.value';
            }
        };

        $repo = new InMemoryServiceTokenRepository();
        $audit = new RecordingAuditRecorder();

        $orgId = new RequestScopedHolder();
        $orgId->set(9);

        $useCase = new IssueServiceTokenUseCase($issuer, $repo, $audit, new FixedClock('2026-05-30T09:00:00+00:00'), $orgId);

        $result = $useCase->execute(
            actorUserId: 11,
            input: new IssueServiceTokenInput(label: 'Records', scopes: ['ingest:submissions'], subject: 'service:records', ttlSeconds: 3600),
        );

        // Plaintext returned once; registry row carries metadata + jti.
        self::assertSame('plaintext.jwt.value', $result->plaintextToken);
        self::assertNotNull($result->token->id);
        self::assertSame('service:records', $result->token->subject);
        self::assertSame(['ingest:submissions'], $result->token->scopes);
        self::assertNull($result->token->revokedAt);

        // JWT claims carry org/scopes/jti/exp.
        self::assertSame(9, $issuer->capture['org']);
        self::assertSame(['ingest:submissions'], $issuer->capture['scopes']);
        self::assertSame('service:records', $issuer->capture['sub']);
        self::assertIsString($issuer->capture['jti']);
        self::assertNotSame('', $issuer->capture['jti']);
        self::assertSame($issuer->capture['iat'] + 3600, $issuer->capture['exp']);

        // Persisted, jti matches the minted token; value never stored.
        $stored = $repo->findById($result->token->id);
        self::assertNotNull($stored);
        self::assertSame($issuer->capture['jti'], $stored->jti);

        // Audited with non-secret metadata only — never the token or jti.
        self::assertCount(1, $audit->records);
        $record = $audit->records[0];
        self::assertSame('service_token.issued', $record['action']);
        self::assertSame(11, $record['actor']);
        self::assertSame(9, $record['org']);
        self::assertNotNull($record['after']);
        self::assertArrayNotHasKey('token', $record['after']);
        self::assertArrayNotHasKey('jti', $record['after']);
        self::assertSame(['ingest:submissions'], $record['after']['scopes']);
    }
}
