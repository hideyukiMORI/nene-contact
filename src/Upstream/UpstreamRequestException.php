<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

use RuntimeException;

/**
 * A sibling HTTP handoff could not be completed (not configured, transport error, or a
 * non-2xx response). The message is safe to surface to operators and to persist as
 * `submission_link.last_error` — it never contains service tokens (M5, ADR 0002).
 */
final class UpstreamRequestException extends RuntimeException
{
}
