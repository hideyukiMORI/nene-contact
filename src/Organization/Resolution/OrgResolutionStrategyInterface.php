<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves the organization identifier (slug or custom domain) from an incoming request.
 *
 * Implementations:
 *  - EnvResolutionStrategy          — ORG_SLUG env var (single-server / dev)
 *  - PathPrefixResolutionStrategy   — /{org}/admin/... → "org"
 *  - SubdomainResolutionStrategy    — org1.example.com → "org1"
 *  - CustomDomainResolutionStrategy — full host, matched to organizations.custom_domain
 *
 * Returns null when this strategy cannot determine an organization from the request.
 */
interface OrgResolutionStrategyInterface
{
    public function resolve(ServerRequestInterface $request): ?string;
}
