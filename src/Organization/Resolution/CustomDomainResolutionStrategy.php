<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves an organization by its full host, matched against
 * organizations.custom_domain by the resolver middleware (findByCustomDomain).
 */
final readonly class CustomDomainResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function resolve(ServerRequestInterface $request): ?string
    {
        $host = $request->getUri()->getHost();

        if ($host === '') {
            return null;
        }

        if (str_contains($host, ':')) {
            $host = explode(':', $host)[0];
        }

        return $host;
    }
}
