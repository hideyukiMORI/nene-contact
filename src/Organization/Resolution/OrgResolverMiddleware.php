<?php

declare(strict_types=1);

namespace NeneContact\Organization\Resolution;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Organization\OrganizationRepositoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Resolves the current organization from the request (admin host strategy) and stores its
 * id in a shared RequestScopedHolder for downstream repositories.
 *
 * Bypass paths skip resolution and pass through with the org id unset:
 *  - /health                — liveness, no tenant
 *  - /admin/auth/           — login issues the token that carries org_id
 *  - /admin/organizations   — superadmin tenant management (cross-tenant)
 *  - /public/, /embed.js    — embed resolves org via public_form_key (ADR 0014), not host
 *  - /api/                  — service clients resolve org via the org-scoped token
 *
 * Repositories on bypass routes must not call $orgId->get().
 */
final readonly class OrgResolverMiddleware implements MiddlewareInterface
{
    /** @var list<string> */
    private const BYPASS_PREFIXES = [
        '/health',
        '/admin/auth/',
        '/admin/organizations',
        '/public/',
        '/embed.js',
        '/api/',
    ];

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private RequestScopedHolder $orgId,
        private OrganizationRepositoryInterface $repository,
        private ProblemDetailsResponseFactory $problemDetails,
        private OrgResolutionStrategyInterface $strategy,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();

        foreach (self::BYPASS_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix)) {
                return $handler->handle($request);
            }
        }

        $identifier = $this->strategy->resolve($request);

        if ($identifier === null) {
            return $this->problemDetails->create(
                $request,
                'org-not-resolved',
                'Organization Not Resolved',
                404,
                'Could not determine the organization for this request. Check TENANT_RESOLUTION.',
            );
        }

        $org = $this->repository->findBySlug($identifier)
            ?? $this->repository->findByCustomDomain($identifier);

        if ($org === null) {
            return $this->problemDetails->create(
                $request,
                'org-not-found',
                'Organization Not Found',
                404,
                "No organization found for '{$identifier}'.",
            );
        }

        if (!$org->isActive) {
            return $this->problemDetails->create(
                $request,
                'org-inactive',
                'Organization Inactive',
                403,
                'This organization is currently inactive.',
            );
        }

        $this->orgId->set($org->id ?? 0);

        return $handler->handle(
            $request->withAttribute('nene2.org.id', $org->id)
                ->withAttribute('nene2.org.slug', $org->slug),
        );
    }
}
