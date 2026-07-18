<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use NeneContact\Audit\AuditRecorder;
use NeneContact\Auth\AdminResetPasswordUseCase;
use NeneContact\Auth\User;
use NeneContact\Auth\UserNotFoundException;
use PHPUnit\Framework\TestCase;

final class AdminResetPasswordUseCaseTest extends TestCase
{
    private function seededRepo(
        int $id = 9,
        string $email = 'admin@example.com',
        ?int $organizationId = 7,
        string $role = 'admin',
    ): InMemoryUserRepository {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(
            id: $id,
            email: $email,
            passwordHash: password_hash('forgotten-pw', PASSWORD_DEFAULT),
            role: $role,
            organizationId: $organizationId,
            status: 'active',
        ));

        return $repo;
    }

    public function test_resets_password_without_current_and_audits_actor_null_without_raw_values(): void
    {
        $repo = $this->seededRepo();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new AdminResetPasswordUseCase($repo, new AuditRecorder($audit));

        $user = $useCase->execute('admin@example.com', 'brand-new-pw');

        $after = $repo->findById(9);
        self::assertNotNull($after);
        self::assertSame(9, $user->id);
        self::assertTrue(password_verify('brand-new-pw', $after->passwordHash));
        self::assertFalse(password_verify('forgotten-pw', $after->passwordHash));

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('user.password_changed', $event->action);
        // An admin reset is distinguished from a self-service change by its null actor.
        self::assertNull($event->actorUserId);
        self::assertSame(7, $event->organizationId);
        self::assertSame('user', $event->entityType);
        self::assertSame(9, $event->entityId);
        // The sanitized snapshots never carry the password hash (ADR 0013).
        self::assertArrayNotHasKey('password_hash', (array) $event->before);
        self::assertArrayNotHasKey('password_hash', (array) $event->after);
    }

    public function test_resets_superadmin_with_null_organization(): void
    {
        $repo = $this->seededRepo(id: 1, email: 'root@example.com', organizationId: null, role: 'superadmin');
        $audit = new InMemoryAuditEventRepository();
        $useCase = new AdminResetPasswordUseCase($repo, new AuditRecorder($audit));

        $useCase->execute('root@example.com', 'new-root-pw');

        self::assertCount(1, $audit->events);
        self::assertNull($audit->events[0]->organizationId);
        self::assertNull($audit->events[0]->actorUserId);
    }

    public function test_rejects_unknown_email(): void
    {
        $repo = $this->seededRepo();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new AdminResetPasswordUseCase($repo, new AuditRecorder($audit));

        try {
            $useCase->execute('nobody@example.com', 'brand-new-pw');
            self::fail('Expected a UserNotFoundException for an unknown email.');
        } catch (UserNotFoundException $e) {
            self::assertStringContainsString('nobody@example.com', $e->getMessage());
        }

        // No user was touched and nothing was audited.
        $user = $repo->findById(9);
        self::assertNotNull($user);
        self::assertTrue(password_verify('forgotten-pw', $user->passwordHash));
        self::assertCount(0, $audit->events);
    }
}
