<?php

declare(strict_types=1);

namespace NeneContact\ServiceApi;

/**
 * Maps a service-API request (path + method) to the {@see ServiceScope} it requires (#388).
 *
 * Only the records ingest write is exposed to service tokens: `POST /api/submissions`. Every
 * other request — including reads on the same path (the MCP agent list surface) — returns null,
 * which the dispatcher treats as "not a service-token route" and rejects for a Bearer service
 * principal (the MCP read surface stays on the static machine key).
 */
final class ServiceScopeResolver
{
    public static function resolve(string $path, string $method): ?ServiceScope
    {
        if ($path === '/api/submissions' && strtoupper($method) === 'POST') {
            return ServiceScope::IngestSubmissions;
        }

        return null;
    }
}
