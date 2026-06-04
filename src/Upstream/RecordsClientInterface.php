<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

/**
 * HTTP boundary to NeNe Records (ADR 0002 — HTTP only, never a shared database). Read-only:
 * Records is the SSOT for the option list; Contact only fetches it for a select field.
 */
interface RecordsClientInterface
{
    /**
     * Fetches the select options for a Records entity/collection.
     *
     * @param string $source the Records entity key
     *
     * @return list<array{value: string, label: string}>
     *
     * @throws UpstreamRequestException when Records is not configured or the request fails
     */
    public function fetchOptions(string $source): array;
}
