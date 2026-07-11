<?php

declare(strict_types=1);

namespace NeneContact\Http;

use Psr\Http\Message\ServerRequestInterface;

/**
 * Recovers the Bearer token on shared hosting whose front proxy strips the standard
 * `Authorization` header before it reaches PHP (observed on HETEML — custom headers pass
 * through, `Authorization` does not; the same fix ships on the sibling NeNe deployments, #118).
 * The admin console mirrors the token into `X-Authorization`; that value is adopted only when
 * `Authorization` is absent, so environments that deliver the standard header are unaffected.
 */
final readonly class AuthorizationHeaderFallback
{
    public const string FALLBACK_HEADER = 'X-Authorization';

    public static function apply(ServerRequestInterface $request): ServerRequestInterface
    {
        if ($request->getHeaderLine('Authorization') !== '') {
            return $request;
        }

        $fallback = $request->getHeaderLine(self::FALLBACK_HEADER);

        if ($fallback === '') {
            return $request;
        }

        return $request->withHeader('Authorization', $fallback);
    }
}
