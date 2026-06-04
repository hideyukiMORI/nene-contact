<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Auth\CreateUserInput;
use NeneContact\Auth\CreateUserUseCase;
use NeneContact\Auth\EmailConflictException;
use NeneContact\Auth\User;
use PHPUnit\Framework\TestCase;

final class CreateUserUseCaseTest extends TestCase
{
    /** @return RequestScopedHolder<int> */
    private function orgHolder(int $orgId): RequestScopedHolder
    {
        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set($orgId);

        return $holder;
    }

    public function test_creates_user_scoped_to_org_and_records_audit_without_password_hash(): void
    {
        $repo = new InMemoryUserRepository();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new CreateUserUseCase($repo, new AuditRecorder($audit), $this->orgHolder(7));

        $user = $useCase->execute(5, new CreateUserInput(email: 'op@example.com', password: 'supersecret', role: 'editor'));

        self::assertSame('op@example.com', $user->email);
        self::assertSame('editor', $user->role);
        self::assertSame(7, $user->organizationId);
        self::assertNotSame('supersecret', $user->passwordHash);
        self::assertTrue(password_verify('supersecret', $user->passwordHash));

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('user.created', $event->action);
        self::assertSame(7, $event->organizationId);
        self::assertNull($event->before);
        self::assertSame('op@example.com', $event->after['email'] ?? null);
        // The password hash is never written to the audit trail.
        self::assertArrayNotHasKey('password_hash', (array) $event->after);
        self::assertStringNotContainsString($user->passwordHash, json_encode($event->after, JSON_THROW_ON_ERROR));
    }

    public function test_rejects_duplicate_email(): void
    {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(id: 1, email: 'taken@example.com', passwordHash: 'x', role: 'admin', organizationId: 7));
        $useCase = new CreateUserUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()), $this->orgHolder(7));

        $this->expectException(EmailConflictException::class);

        $useCase->execute(5, new CreateUserInput(email: 'taken@example.com', password: 'supersecret', role: 'admin'));
    }
}
