<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface AdminResetPasswordUseCaseInterface
{
    /**
     * Resets the password of the user addressed by email, without knowing the current one.
     *
     * For out-of-band operator recovery (a lost admin password) via the bootstrap CLI —
     * never reachable over HTTP. There is no authenticated actor, so the audit trail records
     * actor=null; an admin reset writes the same `user.password_changed` event as a
     * self-service change and is told apart by that null actor.
     *
     * @throws UserNotFoundException when no user has that email
     */
    public function execute(string $email, string $newPassword): User;
}
