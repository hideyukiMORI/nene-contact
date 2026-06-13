<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorder;
use NeneContact\Auth\ChangePasswordInput;
use NeneContact\Auth\ChangePasswordUseCase;
use NeneContact\Auth\User;
use NeneContact\Auth\UserNotFoundException;
use PHPUnit\Framework\TestCase;

final class ChangePasswordUseCaseTest extends TestCase
{
    private function seededRepo(int $id = 9): InMemoryUserRepository
    {
        $repo = new InMemoryUserRepository();
        $repo->seed(new User(
            id: $id,
            email: 'op@example.com',
            passwordHash: password_hash('current-pw', PASSWORD_DEFAULT),
            role: 'editor',
            organizationId: 7,
            status: 'active',
        ));

        return $repo;
    }

    public function test_changes_password_and_audits_without_raw_values(): void
    {
        $repo = $this->seededRepo();
        $audit = new InMemoryAuditEventRepository();
        $useCase = new ChangePasswordUseCase($repo, new AuditRecorder($audit));

        $useCase->execute(9, new ChangePasswordInput(currentPassword: 'current-pw', newPassword: 'brand-new-pw'));

        $after = $repo->findById(9);
        self::assertNotNull($after);
        self::assertTrue(password_verify('brand-new-pw', $after->passwordHash));
        self::assertFalse(password_verify('current-pw', $after->passwordHash));

        self::assertCount(1, $audit->events);
        $event = $audit->events[0];
        self::assertSame('user.password_changed', $event->action);
        self::assertSame(9, $event->actorUserId);
        self::assertSame(7, $event->organizationId);
        // The sanitized snapshots never carry the password hash (ADR 0013).
        self::assertArrayNotHasKey('password_hash', (array) $event->before);
        self::assertArrayNotHasKey('password_hash', (array) $event->after);
    }

    public function test_rejects_incorrect_current_password(): void
    {
        $repo = $this->seededRepo();
        $useCase = new ChangePasswordUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()));

        try {
            $useCase->execute(9, new ChangePasswordInput(currentPassword: 'wrong-pw', newPassword: 'brand-new-pw'));
            self::fail('Expected a ValidationException for an incorrect current password.');
        } catch (ValidationException $e) {
            self::assertNotSame([], $e->errors());
            self::assertSame('current_password', $e->errors()[0]->field);
        }

        // The stored password is unchanged.
        $user = $repo->findById(9);
        self::assertNotNull($user);
        self::assertTrue(password_verify('current-pw', $user->passwordHash));
    }

    public function test_rejects_unknown_actor(): void
    {
        $repo = new InMemoryUserRepository();
        $useCase = new ChangePasswordUseCase($repo, new AuditRecorder(new InMemoryAuditEventRepository()));

        $this->expectException(UserNotFoundException::class);

        $useCase->execute(404, new ChangePasswordInput(currentPassword: 'x', newPassword: 'brand-new-pw'));
    }
}
