<?php

declare(strict_types=1);

namespace NeneContact\Api;

/**
 * Masks submitted field values for the redacted agent read surface (charter §11): an agent
 * sees enough to triage (a hint of the value) but never the full personal data. Only the
 * explicit, audit-logged `include_pii=true` path returns raw values. IP / user-agent are
 * never exposed by the agent surface at all (handled by the responses, not here).
 */
final class PiiMasker
{
    /**
     * @param array<string, mixed> $values
     *
     * @return array<string, mixed>
     */
    public static function maskValues(array $values): array
    {
        $masked = [];
        foreach ($values as $key => $value) {
            $masked[$key] = self::mask($value);
        }

        return $masked;
    }

    private static function mask(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map(static fn (mixed $v): mixed => self::mask($v), $value);
        }

        // Selections and numbers are not free-text PII; leave them legible for triage.
        if (!is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return $value;
        }

        if (filter_var($trimmed, FILTER_VALIDATE_EMAIL) !== false) {
            return self::maskEmail($trimmed);
        }

        return self::maskString($trimmed);
    }

    private static function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);

        $dot = strrpos($domain, '.');
        if ($dot === false) {
            $maskedDomain = self::head($domain) . '***';
        } else {
            $host = substr($domain, 0, $dot);
            $tld = substr($domain, $dot); // includes the leading dot
            $maskedDomain = self::head($host) . '***' . $tld;
        }

        return self::head($local) . '***@' . $maskedDomain;
    }

    private static function maskString(string $value): string
    {
        // First character as a hint, then a fixed mask — length is not revealed.
        return self::head($value) . '***';
    }

    private static function head(string $value): string
    {
        return $value === '' ? '' : mb_substr($value, 0, 1);
    }
}
