<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\Organization\OrganizationRepositoryInterface;
use Symfony\Component\Mime\Address;
use Throwable;

/**
 * Resolves an organization's outgoing email identity (email-wording wave b). The From display name
 * comes from the org (sender_display_name, else the org name) — org settings win over env — while
 * the address comes from the env MAIL_FROM. The signature comes from the org. Symfony Mime
 * RFC-2047-encodes a non-ASCII display name automatically when the From string is later parsed.
 */
final readonly class OrganizationMailSettingsResolver
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
        private string $envFrom,
    ) {
    }

    public function resolve(int $organizationId): OrganizationMailSettings
    {
        $org = $this->organizations->findById($organizationId);

        $displayName = $org !== null ? ($org->senderDisplayName ?? $org->name) : null;
        $address = $this->address();

        $from = ($displayName !== null && $displayName !== '')
            ? sprintf('%s <%s>', $displayName, $address)
            : $address;

        $signature = $org !== null ? ($org->emailSignature ?? '') : '';

        return new OrganizationMailSettings($from, $signature);
    }

    /**
     * The address part of the env MAIL_FROM, which may be a bare address or `Name <addr>`.
     */
    private function address(): string
    {
        try {
            return Address::create($this->envFrom)->getAddress();
        } catch (Throwable) {
            return $this->envFrom;
        }
    }
}
