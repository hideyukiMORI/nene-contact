<?php

declare(strict_types=1);

namespace NeneContact\Organization;

final readonly class GetOrganizationByIdOutput
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public string $plan,
        public bool $isActive,
        public ?string $externalId,
        public ?string $customDomain,
        public ?string $senderDisplayName,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }
}
