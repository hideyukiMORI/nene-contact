<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Auth\TokenVerificationException;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Authenticates admin requests with a Bearer JWT and exposes the claims on the request.
 *
 * Open (no token): /health, /admin/auth/*, /public/*, /embed.js. Everything under
 * /admin/* is protected (operator-only). On success, sets nene2.auth.claims for
 * {@see CapabilityMiddleware}.
 */
final readonly class AdminApiAuthMiddleware implements MiddlewareInterface
{
    /** @var list<string> */
    private const ALWAYS_OPEN_PREFIXES = [
        '/health',
        '/admin/auth/',
        '/public/',
        '/embed.js',
    ];

    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private TokenVerifierInterface $verifier,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (!$this->requiresAuthentication($request)) {
            return $handler->handle($request);
        }

        $authorization = $request->getHeaderLine('Authorization');

        if ($authorization === '') {
            return $this->unauthorized($request, 'missing_token', 'No Bearer token was provided.');
        }

        if (!str_starts_with($authorization, 'Bearer ')) {
            return $this->unauthorized($request, 'invalid_token', 'Authorization header must use the Bearer scheme.');
        }

        try {
            $claims = $this->verifier->verify(substr($authorization, 7));
        } catch (TokenVerificationException $e) {
            return $this->unauthorized($request, 'invalid_token', $e->getMessage());
        }

        return $handler->handle(
            $request
                ->withAttribute('nene2.auth.credential_type', 'bearer')
                ->withAttribute('nene2.auth.claims', $claims),
        );
    }

    private function requiresAuthentication(ServerRequestInterface $request): bool
    {
        $path = $request->getUri()->getPath() ?: '/';

        foreach (self::ALWAYS_OPEN_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix)) {
                return false;
            }
        }

        return str_starts_with($path, '/admin/');
    }

    private function unauthorized(ServerRequestInterface $request, string $error, string $description): ResponseInterface
    {
        return $this->problemDetails
            ->create($request, 'unauthorized', 'Unauthorized', 401, $description)
            ->withHeader(
                'WWW-Authenticate',
                sprintf(
                    'Bearer realm="NeNe Contact", error="%s", error_description="%s"',
                    $error,
                    $this->sanitizeHeaderParam($description),
                ),
            );
    }

    private function sanitizeHeaderParam(string $value): string
    {
        return str_replace('"', '\\"', preg_replace('/\r?\n|\r/', ' ', $value) ?? $value);
    }
}
