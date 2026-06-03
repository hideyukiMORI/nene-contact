<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Resolves the org slug from a fixed value (ORG_SLUG env). Used by the `single`
 * resolution mode where one organization owns the whole instance.
 */
final readonly class EnvResolutionStrategy implements OrgResolutionStrategyInterface
{
    public function __construct(
        private ?string $orgSlug,
    ) {
    }

    public function resolve(ServerRequestInterface $request): ?string
    {
        return $this->orgSlug !== null && $this->orgSlug !== '' ? $this->orgSlug : null;
    }
}
