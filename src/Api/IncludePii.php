<?php

declare(strict_types=1);

namespace NeneContact\Api;

/** Parses the `include_pii` query flag for the agent surface (default false / redacted). */
final class IncludePii
{
    /** @param array<string, mixed> $params */
    public static function fromQuery(array $params): bool
    {
        $raw = $params['include_pii'] ?? null;

        if (is_bool($raw)) {
            return $raw;
        }

        return is_string($raw) && in_array(strtolower($raw), ['1', 'true', 'yes', 'on'], true);
    }
}
