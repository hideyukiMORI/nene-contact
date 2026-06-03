<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves the org slug from a subdomain: org1.example.com → "org1"
 * (BASE_DOMAIN=example.com). The bare base domain resolves to null.
 */
final readonly class SubdomainResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function __construct(
        private string $baseDomain,
    ) {
    }

    public function resolve(ServerRequestInterface $request): ?string
    {
        $host = $request->getUri()->getHost();

        if (str_contains($host, ':')) {
            $host = explode(':', $host)[0];
        }

        $baseParts = explode('.', $this->baseDomain);
        $hostParts = explode('.', $host);

        if (count($hostParts) <= count($baseParts)) {
            return null;
        }

        $tail = array_slice($hostParts, -count($baseParts));
        if ($tail !== $baseParts) {
            return null;
        }

        return $hostParts[0];
    }
}
