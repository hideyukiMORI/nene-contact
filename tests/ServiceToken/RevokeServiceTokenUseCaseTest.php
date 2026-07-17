<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceToken;

use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceToken\RevokeServiceTokenUseCase;
use NeneContact\ServiceToken\ServiceToken;
use NeneContact\ServiceToken\ServiceTokenNotFoundException;
use NeneContact\Tests\Support\FixedClock;
use NeneContact\Tests\Support\InMemoryServiceTokenRepository;
use NeneContact\Tests\Support\RecordingAuditRecorder;
use PHPUnit\Framework\TestCase;

final class RevokeServiceTokenUseCaseTest extends TestCase
{
    public function test_revokes_and_audits(): void
    {
        $repo = new InMemoryServiceTokenRepository();
        $id = $repo->save($this->token());
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(3);

        $useCase = new RevokeServiceTokenUseCase($repo, $audit, new FixedClock('2026-05-30T09:00:00+00:00'), $orgId);

        $useCase->execute(actorUserId: 8, id: $id);

        self::assertSame(['2026-05-30 09:00:00'], $repo->revoked, 'revoked_at passed to repository');
        $stored = $repo->findById($id);
        self::assertNotNull($stored);
        self::assertSame('2026-05-30 09:00:00', $stored->revokedAt);

        self::assertCount(1, $audit->records);
        self::assertSame('service_token.revoked', $audit->records[0]['action']);
        self::assertSame(8, $audit->records[0]['actor']);
        self::assertSame(3, $audit->records[0]['org']);
        self::assertNotNull($audit->records[0]['after']);
        self::assertSame('2026-05-30 09:00:00', $audit->records[0]['after']['revoked_at']);
    }

    public function test_unknown_token_throws_and_is_not_audited(): void
    {
        $repo = new InMemoryServiceTokenRepository();
        $audit = new RecordingAuditRecorder();
        $orgId = new RequestScopedHolder();
        $orgId->set(3);

        $useCase = new RevokeServiceTokenUseCase($repo, $audit, new FixedClock(), $orgId);

        try {
            $useCase->execute(actorUserId: 8, id: 999);
            self::fail('expected ServiceTokenNotFoundException');
        } catch (ServiceTokenNotFoundException) {
            // expected
        }

        self::assertSame([], $audit->records, 'a non-event must not be audited');
    }

    private function token(): ServiceToken
    {
        return new ServiceToken(
            id: null,
            organizationId: 3,
            jti: 'jti-live',
            subject: 'service:records',
            label: 'Records',
            scopes: ['ingest:submissions'],
            createdBy: 8,
            createdAt: '2026-05-30 09:00:00',
            expiresAt: '2027-05-30 09:00:00',
            revokedAt: null,
        );
    }
}
