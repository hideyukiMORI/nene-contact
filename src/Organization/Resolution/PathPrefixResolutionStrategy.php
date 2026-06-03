<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves the org slug from the first URL path segment: /org1/admin/... → "org1".
 * Best for shared-host deployments without wildcard subdomains.
 */
final readonly class PathPrefixResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function resolve(ServerRequestInterface $request): ?string
    {
        $trimmed = ltrim($request->getUri()->getPath(), '/');
        $candidate = explode('/', $trimmed, 2)[0];

        return $candidate !== '' ? $candidate : null;
    }
}
