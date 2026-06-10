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
}
