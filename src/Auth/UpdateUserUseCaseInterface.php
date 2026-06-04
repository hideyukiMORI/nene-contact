<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface UpdateUserUseCaseInterface
{
    public function execute(?int $actorUserId, int $id, UpdateUserInput $input): User;
}
