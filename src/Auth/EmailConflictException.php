<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use RuntimeException;

final class EmailConflictException extends RuntimeException
{
    public function __construct(string $email)
    {
        parent::__construct("A user with email '{$email}' already exists.");
    }
}
