<?php

declare(strict_types=1);

namespace NeneContact\Auth;

final readonly class ChangePasswordInput
{
    public function __construct(
        public string $currentPassword,
        public string $newPassword,
    ) {
    }
}
