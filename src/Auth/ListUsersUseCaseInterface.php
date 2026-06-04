<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface ListUsersUseCaseInterface
{
    /** @return list<User> */
    public function execute(): array;
}
