<?php

declare(strict_types=1);

namespace NeneContact\Organization;

final readonly class UpdateOrganizationInput
{
    /**
     * @param ?string $senderDisplayName the email From display name; null clears it (the From
     *                                    then falls back to the organization name).
     * @param ?string $emailSignature    signature appended to outgoing emails; null clears it.
     */
    public function __construct(
        public ?string $senderDisplayName,
        public ?string $emailSignature,
    ) {
    }
}
