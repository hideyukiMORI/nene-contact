<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Auth\UpdateUserInput;
use NeneContact\Auth\UpdateUserUseCase;
use NeneContact\Auth\User;
use NeneContact\Auth\UserNotFoundException;
use PHPUnit\Framework\TestCase;

final class UpdateUserUseCaseTest extends TestCase
{
    /** @return RequestScopedHolder<int> */
    private function orgHolder(int $orgId): RequestScopedHolder
    {
        /** @var RequestScopedHolder<int> $holder */
        $holder = new RequestScopedHolder();
        $holder->set($orgId);

        return $holder;
    }

    public function test_updates_role_and_status_with_before_after_audit(): void
    {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(id: 9, email: 'op@example.com', passwordHash: 'x', role: 'editor', organizationId: 7, status: 'active'));
        $audit = new InMemoryAuditEventRepository();
        $useCase = new UpdateUserUseCase($repo, new AuditRecorder($audit), $this->orgHolder(7));

        $result = $useCase->execute(5, 9, new UpdateUserInput(role: 'admin', status: 'disabled'));

        self::assertSame('admin', $result->role);
        self::assertSame('disabled', $result->status);

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('user.updated', $event->action);
        self::assertSame('editor', $event->before['role'] ?? null);
        self::assertSame('active', $event->before['status'] ?? null);
        self::assertSame('admin', $event->after['role'] ?? null);
        self::assertSame('disabled', $event->after['status'] ?? null);
        self::assertArrayNotHasKey('password_hash', (array) $event->after);
    }

    public function test_partial_update_keeps_unspecified_fields(): void
    {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(id: 9, email: 'op@example.com', passwordHash: 'x', role: 'editor', organizationId: 7, status: 'active'));
        $useCase = new UpdateUserUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()), $this->orgHolder(7));

        $result = $useCase->execute(5, 9, new UpdateUserInput(status: 'disabled'));

        self::assertSame('editor', $result->role);
        self::assertSame('disabled', $result->status);
    }

    public function test_rejects_cross_tenant_target_as_not_found(): void
    {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(id: 9, email: 'other@example.com', passwordHash: 'x', role: 'editor', organizationId: 99, status: 'active'));
        $useCase = new UpdateUserUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()), $this->orgHolder(7));

        $this->expectException(UserNotFoundException::class);

        $useCase->execute(5, 9, new UpdateUserInput(status: 'disabled'));
    }

    public function test_rejects_unknown_user(): void
    {
        $repo = new InMemoryUserRepository();
        $useCase = new UpdateUserUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()), $this->orgHolder(7));

        $this->expectException(UserNotFoundException::class);

        $useCase->execute(5, 404, new UpdateUserInput(role: 'admin'));
    }
}
