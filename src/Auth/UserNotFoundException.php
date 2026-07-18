<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use RuntimeException;

final class UserNotFoundException extends RuntimeException
{
    public function __construct(int|string $identifier)
    {
        parent::__construct("User {$identifier} not found.");
    }
}
