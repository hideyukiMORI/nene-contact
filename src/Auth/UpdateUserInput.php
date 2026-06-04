<?php

declare(strict_types=1);

namespace NeneContact\Auth;

final readonly class UpdateUserInput
{
    public function __construct(
        public ?string $role = null,
        public ?string $status = null,
    ) {
    }
}
