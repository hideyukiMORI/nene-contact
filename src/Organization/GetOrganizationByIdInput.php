<?php

declare(strict_types=1);

namespace NeneContact\Organization;

final readonly class GetOrganizationByIdInput
{
    public function __construct(
        public int $id,
    ) {
    }
}
