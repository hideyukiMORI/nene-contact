<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

/**
 * Validated payload for issuing a service token (#388).
 *
 * @param list<string> $scopes registered {@see \NeneContact\ServiceApi\ServiceScope} values
 */
final readonly class IssueServiceTokenInput
{
    /**
     * @param list<string> $scopes
     */
    public function __construct(
        public string $label,
        public array $scopes,
        public string $subject,
        public int $ttlSeconds,
    ) {
    }
}
