<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use RuntimeException;

final class UserNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("User {$id} not found.");
    }
}
