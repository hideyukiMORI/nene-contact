<?php

declare(strict_types=1);

namespace NeneContact\Auth;

interface GetUserByIdUseCaseInterface
{
    public function execute(int $id): User;
}
