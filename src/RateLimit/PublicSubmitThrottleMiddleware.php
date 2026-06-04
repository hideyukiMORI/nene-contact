<?php

declare(strict_types=1);

namespace NeneContact\RateLimit;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Rate limits the public submit endpoint (ADR 0010 / charter P5): only
 * POST /public/forms/{public_form_key}/submissions is throttled, with two fixed-window
 * buckets — one per client IP and one per public_form_key. Exceeding either returns
 * 429 `rate-limited`. All other routes pass through untouched.
 */
final readonly class PublicSubmitThrottleMiddleware implements MiddlewareInterface
{
    private const WINDOW_SECONDS = 60;
    private const PER_IP_LIMIT = 20;
    private const PER_FORM_LIMIT = 100;

    public function __construct(
        private RateLimitStorageInterface $storage,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $formKey = $this->submitFormKey($request);

        if ($formKey === null) {
            return $handler->handle($request);
        }

        $params = $request->getServerParams();
        $ip = isset($params['REMOTE_ADDR']) ? (string) $params['REMOTE_ADDR'] : 'unknown';

        $ipResult = $this->storage->hit('submit:ip:' . $ip, self::WINDOW_SECONDS);
        if ($ipResult['count'] > self::PER_IP_LIMIT) {
            return $this->tooMany($request, self::PER_IP_LIMIT, $ipResult['reset_at']);
        }

        $formResult = $this->storage->hit('submit:form:' . $formKey, self::WINDOW_SECONDS);
        if ($formResult['count'] > self::PER_FORM_LIMIT) {
            return $this->tooMany($request, self::PER_FORM_LIMIT, $formResult['reset_at']);
        }

        return $handler->handle($request);
    }

    private function submitFormKey(ServerRequestInterface $request): ?string
    {
        if (strtoupper($request->getMethod()) !== 'POST') {
            return null;
        }

        if (preg_match('#^/public/forms/([^/]+)/(submissions|attachments)$#', $request->getUri()->getPath(), $m) === 1) {
            return $m[1];
        }

        return null;
    }

    private function tooMany(ServerRequestInterface $request, int $limit, int $resetAt): ResponseInterface
    {
        $retryAfter = max(0, $resetAt - time());

        return $this->problemDetails
            ->create(
                $request,
                'rate-limited',
                'Too Many Requests',
                429,
                sprintf('Rate limit of %d requests per %d seconds exceeded. Try again in %d seconds.', $limit, self::WINDOW_SECONDS, $retryAfter),
            )
            ->withHeader('Retry-After', (string) $retryAfter)
            ->withHeader('X-RateLimit-Limit', (string) $limit)
            ->withHeader('X-RateLimit-Remaining', '0')
            ->withHeader('X-RateLimit-Reset', (string) $resetAt);
    }
}
