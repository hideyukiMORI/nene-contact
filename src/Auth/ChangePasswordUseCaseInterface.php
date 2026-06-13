<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface ChangePasswordUseCaseInterface
{
    /**
     * Changes the authenticated actor's own password after verifying the current one.
     *
     * @throws UserNotFoundException             when the token actor no longer exists
     * @throws \Nene2\Validation\ValidationException when the current password is incorrect
     */
    public function execute(int $actorUserId, ChangePasswordInput $input): void;
}
