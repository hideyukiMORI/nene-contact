<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use LogicException;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Lets an authenticated operator change their own password. The actor is taken from the
 * token (never a path id), so this can only ever rotate the caller's own credential. The
 * current password is verified here (domain rule); a mismatch is a `current_password`
 * validation error. The change is audited (ADR 0013) with no raw values — UserResponse
 * carries no password hash, so the before/after snapshots are safe.
 */
final readonly class ChangePasswordUseCase implements ChangePasswordUseCaseInterface
{
    public function __construct(
        private UserRepositoryInterface $users,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(int $actorUserId, ChangePasswordInput $input): void
    {
        $before = $this->users->findById($actorUserId);

        if ($before === null) {
            throw new UserNotFoundException($actorUserId);
        }

        if (!password_verify($input->currentPassword, $before->passwordHash)) {
            throw new ValidationException([
                new ValidationError('current_password', 'The current password is incorrect.', 'invalid'),
            ]);
        }

        $this->users->updatePassword($actorUserId, password_hash($input->newPassword, PASSWORD_DEFAULT));

        $after = $this->users->findById($actorUserId);

        if ($after === null) {
            throw new LogicException('User disappeared immediately after password change.');
        }

        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'user.password_changed',
            'user',
            $actorUserId,
            UserResponse::toArray($before),
            UserResponse::toArray($after),
        );
    }
}
