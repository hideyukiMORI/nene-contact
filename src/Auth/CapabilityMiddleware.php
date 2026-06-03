<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Enforces role-based capabilities and organization scoping on authenticated requests.
 * Runs after AdminApiAuthMiddleware. Unauthenticated requests pass through unchanged
 * (AdminApiAuthMiddleware already rejected protected routes without a token).
 *
 * Organization scoping:
 *  - superadmin: no org check (cross-tenant)
 *  - admin / editor: JWT org_id must equal the resolved org id (nene2.org.id). When the
 *    route bypasses org resolution (e.g. /admin/organizations), the org check is skipped.
 */
final readonly class CapabilityMiddleware implements MiddlewareInterface
{
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $claims = $request->getAttribute('nene2.auth.claims');

        if (!is_array($claims)) {
            return $handler->handle($request);
        }

        $path = $request->getUri()->getPath() ?: '/';
        $required = CapabilityResolver::resolve($path, $request->getMethod());

        if ($required === null) {
            return $handler->handle($request);
        }

        $role = Role::tryFrom((string) ($claims['role'] ?? ''));

        if ($role === null || !$role->hasCapability($required)) {
            return $this->problemDetails->create(
                $request,
                'forbidden',
                'Forbidden',
                403,
                'You do not have permission to perform this action.',
            );
        }

        if ($role !== Role::Superadmin) {
            $resolvedOrgId = $request->getAttribute('nene2.org.id');

            if (is_int($resolvedOrgId)) {
                $jwtOrgId = isset($claims['org_id']) && is_int($claims['org_id']) ? $claims['org_id'] : null;

                if ($jwtOrgId !== $resolvedOrgId) {
                    return $this->problemDetails->create(
                        $request,
                        'org-access-denied',
                        'Organization Access Denied',
                        403,
                        'Access to this organization is not permitted.',
                    );
                }
            }
        }

        return $handler->handle($request);
    }
}
