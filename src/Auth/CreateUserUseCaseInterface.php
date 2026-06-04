<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface CreateUserUseCaseInterface
{
    public function execute(?int $actorUserId, CreateUserInput $input): User;
}
