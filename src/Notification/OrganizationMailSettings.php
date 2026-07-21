<?php

declare(strict_types=1);

namespace NeneContact\Notification;

/**
 * The resolved email identity for an organization: the From header (display name + address) and
 * an optional signature appended to the body.
 */
final readonly class OrganizationMailSettings
{
    public function __construct(
        public string $from,
        public string $signature,
    ) {
    }

    /**
     * Appends the signature (when set) to an email body, preserving its line breaks. The
     * signature is operator-authored — never a submission value — so this is backscatter-safe.
     */
    public function applyTo(string $body): string
    {
        if ($this->signature === '') {
            return $body;
        }

        return rtrim($body, "\n") . "\n\n" . $this->signature . "\n";
    }
}
