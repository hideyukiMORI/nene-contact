<?php

declare(strict_types=1);

namespace NeneContact\Tests\Http;

use NeneContact\Http\AuthorizationHeaderFallback;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;

final class AuthorizationHeaderFallbackTest extends TestCase
{
    public function test_adopts_x_authorization_when_authorization_is_absent(): void
    {
        $request = (new ServerRequest('GET', '/admin/forms'))
            ->withHeader('X-Authorization', 'Bearer token-123');

        $result = AuthorizationHeaderFallback::apply($request);

        self::assertSame('Bearer token-123', $result->getHeaderLine('Authorization'));
    }

    public function test_leaves_a_present_authorization_header_untouched(): void
    {
        $request = (new ServerRequest('GET', '/admin/forms'))
            ->withHeader('Authorization', 'Bearer real')
            ->withHeader('X-Authorization', 'Bearer mirror');

        $result = AuthorizationHeaderFallback::apply($request);

        // The standard header wins where it is delivered; the mirror is never adopted over it.
        self::assertSame('Bearer real', $result->getHeaderLine('Authorization'));
    }

    public function test_no_op_when_neither_header_is_present(): void
    {
        $request = new ServerRequest('GET', '/admin/forms');

        $result = AuthorizationHeaderFallback::apply($request);

        self::assertSame('', $result->getHeaderLine('Authorization'));
    }
}
