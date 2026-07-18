<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use LogicException;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Resets an operator's password out-of-band, for lost-password recovery via the bootstrap
 * CLI. Unlike {@see ChangePasswordUseCase} this verifies no current password and takes no
 * token actor — it exists precisely for the case where the current password is unknown, so
 * requiring it would defeat the purpose.
 *
 * The change is audited (ADR 0013) as `user.password_changed` — the same event as a
 * self-service change, because the domain fact is identical (a credential was rotated). An
 * admin reset is distinguished by **actor=null** (the CLI has no authenticated operator),
 * whereas a self-service change carries the actor's own id. The before/after snapshots come
 * from UserResponse, which never includes the password hash, so no raw credential is stored.
 *
 * Known limitation: actor=null means the audit records *that* an admin reset happened (with
 * the target and before/after), but not *who* ran the CLI — the operator with shell access.
 * This mirrors the other bootstrap CLIs (e.g. update-contact-form.php).
 */
final readonly class AdminResetPasswordUseCase implements AdminResetPasswordUseCaseInterface
{
    public function __construct(
        private UserRepositoryInterface $users,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(string $email, string $newPassword): User
    {
        $before = $this->users->findByEmail($email);

        if ($before === null) {
            throw new UserNotFoundException($email);
        }

        $this->users->updatePassword($before->id, password_hash($newPassword, PASSWORD_DEFAULT));

        $after = $this->users->findById($before->id);

        if ($after === null) {
            throw new LogicException('User disappeared immediately after password reset.');
        }

        $this->audit->record(
            null,
            $before->organizationId,
            'user.password_changed',
            'user',
            $before->id,
            UserResponse::toArray($before),
            UserResponse::toArray($after),
        );

        return $after;
    }
}
