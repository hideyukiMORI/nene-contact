<?php

declare(strict_types=1);

namespace NeneContact\Organization;

final readonly class UpdateOrganizationInput
{
    /**
     * @param ?string $senderDisplayName the email From display name; null clears it (the From
     *                                    then falls back to the organization name).
     */
    public function __construct(
        public ?string $senderDisplayName,
    ) {
    }
}
