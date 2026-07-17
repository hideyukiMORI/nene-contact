<?php

declare(strict_types=1);

namespace NeneContact\ServiceApi;

use Nene2\Auth\TokenVerificationException;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceToken\ServiceTokenAuthorizerInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Unified auth for the records ingest endpoint `POST /api/submissions` (embed 案1, #388,
 * hub design ruling Q1(A)). The rest of `/api/*` (the MCP agent read surface) stays gated by
 * the NENE2 static machine key ({@see \Nene2\Middleware\ApiKeyAuthenticationMiddleware}); this
 * one path is carved out of that gate (`machineApiKeyExcludedPaths`) and owned here.
 *
 * Dispatch (NO fall-through):
 *  - An `Authorization: Bearer` header commits the request to the service-token path — a bad,
 *    expired, unscoped, or revoked token ends in 4xx here and never falls back to the static
 *    key. If both an `Authorization: Bearer` and the static key header are present, Bearer wins.
 *  - Otherwise the static machine key (`X-NENE2-API-Key`) is accepted (backwards-compatible
 *    with the MCP surface; org is resolved by the tenant strategy upstream).
 *  - Neither → 401.
 *
 * A service principal is a token carrying a `scopes` claim. Org comes from the token's `org`
 * claim (not the URL), so this middleware sets the request-scoped org holder from it. A token
 * without a `jti` is rejected (401): Contact issues every service token with a `jti`, so a
 * missing one is never exempt from revocation ({@see ServiceTokenAuthorizerInterface}).
 */
final readonly class ServiceApiAuthMiddleware implements MiddlewareInterface
{
    private const INGEST_PATH = '/api/submissions';
    private const API_KEY_HEADER = 'X-NENE2-API-Key';

    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private TokenVerifierInterface $verifier,
        private RequestScopedHolder $orgId,
        private ServiceTokenAuthorizerInterface $authorizer,
        private ?string $machineApiKey,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath() ?: '/';
        $method = strtoupper($request->getMethod());

        // Only the carved-out ingest path is owned here; everything else already passed the
        // appropriate gate (NENE2 static key for the rest of /api/*, admin JWT for /admin/*).
        if ($path !== self::INGEST_PATH || $method === 'OPTIONS') {
            return $handler->handle($request);
        }

        $authorization = $request->getHeaderLine('Authorization');

        // No fall-through: a Bearer header commits to the service-token path.
        if (str_starts_with($authorization, 'Bearer ')) {
            return $this->handleServiceToken($request, $handler, substr($authorization, 7), $path, $method);
        }

        $providedKey = $request->getHeaderLine(self::API_KEY_HEADER);

        if ($providedKey !== '') {
            if ($this->machineApiKey === null || !hash_equals($this->machineApiKey, $providedKey)) {
                return $this->unauthorized($request, 'A valid API key is required for this endpoint.');
            }

            return $handler->handle($request->withAttribute('nene2.auth.credential_type', 'api_key'));
        }

        return $this->unauthorized($request, 'A Bearer service token or API key is required for this endpoint.');
    }

    private function handleServiceToken(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler,
        string $token,
        string $path,
        string $method,
    ): ResponseInterface {
        try {
            $claims = $this->verifier->verify($token);
        } catch (TokenVerificationException $e) {
            return $this->unauthorized($request, $e->getMessage());
        }

        // A service principal carries a `scopes` claim; an operator JWT does not and is not
        // valid on the service surface.
        $scopes = $claims['scopes'] ?? null;
        if (!is_array($scopes)) {
            return $this->forbidden($request, 'This token is not a service principal.');
        }

        $required = ServiceScopeResolver::resolve($path, $method);
        if ($required === null || !in_array($required->value, $scopes, true)) {
            return $this->forbidden($request, 'The service token lacks the required scope for this operation.');
        }

        $organizationId = $claims['org'] ?? null;
        if (!is_int($organizationId)) {
            return $this->forbidden($request, 'The service token is not scoped to an organization.');
        }

        // Revocation: Contact issues every service token with a `jti`. A token lacking one is
        // rejected (never exempt); a registered but revoked jti is rejected too. Fail-closed.
        $jti = $claims['jti'] ?? null;
        if (!is_string($jti) || $jti === '') {
            return $this->unauthorized($request, 'The service token is missing its identifier.');
        }

        if (!$this->authorizer->isActive($jti)) {
            return $this->revoked($request);
        }

        // The token's org is authoritative for this request (overrides tenant-strategy resolution).
        $this->orgId->set($organizationId);

        return $handler->handle($request->withAttribute('nene2.auth.credential_type', 'service_token'));
    }

    private function unauthorized(ServerRequestInterface $request, string $detail): ResponseInterface
    {
        return $this->problemDetails->create($request, 'unauthorized', 'Unauthorized', 401, $detail);
    }

    private function revoked(ServerRequestInterface $request): ResponseInterface
    {
        return $this->problemDetails->create($request, 'service-token-revoked', 'Unauthorized', 401, 'The service token has been revoked.');
    }

    private function forbidden(ServerRequestInterface $request, string $detail): ResponseInterface
    {
        return $this->problemDetails->create($request, 'insufficient-scope', 'Forbidden', 403, $detail);
    }
}
