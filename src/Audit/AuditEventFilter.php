<?php

declare(strict_types=1);

namespace NeneContact\Audit;

/**
 * Server-side filter for the audit trail. The log is append-only and grows without bound,
 * so search/date filtering runs in SQL rather than over a client window. `q` matches the
 * action and entity (type/id); `from`/`to` bound created_at (inclusive, YYYY-MM-DD).
 */
final readonly class AuditEventFilter
{
    public function __construct(
        public ?string $q = null,
        public ?string $from = null,
        public ?string $to = null,
    ) {
    }

    /**
     * Reads the filter off the query string. Shared by the list and the CSV export so the
     * export always covers exactly what the viewer is looking at.
     *
     * @param array<string, mixed> $params
     */
    public static function fromQueryParams(array $params): self
    {
        return new self(
            q: self::stringParam($params, 'q'),
            from: self::stringParam($params, 'from'),
            to: self::stringParam($params, 'to'),
        );
    }

    /**
     * @param array<string, mixed> $params
     */
    private static function stringParam(array $params, string $key): ?string
    {
        $value = $params[$key] ?? null;
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
