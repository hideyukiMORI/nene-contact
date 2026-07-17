<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceApi;

use Nene2\Auth\TokenVerificationException;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ServiceApi\ServiceApiAuthMiddleware;
use NeneContact\ServiceToken\ServiceTokenAuthorizerInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The security-critical dispatcher (embed 案1, #388, hub Q1(A)). Covers the mandated matrix:
 * (i) valid+scope→pass (ii) valid+scope-short→403 (iii) revoked→401 (iv) malformed/no-jti→401
 * no-fallthrough (v) both headers→Bearer wins (vi) static key only→unchanged (vii) none→401.
 */
final class ServiceApiAuthMiddlewareTest extends TestCase
{
    private const STATIC_KEY = 'static-machine-key';

    /** @var RequestScopedHolder<int> */
    private RequestScopedHolder $orgId;
    private bool $handlerCalled = false;

    protected function setUp(): void
    {
        $this->orgId = new RequestScopedHolder();
        $this->handlerCalled = false;
    }

    // (i)
    public function test_valid_bearer_with_scope_passes_and_sets_org_from_token(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('Authorization', 'Bearer good'),
            verifier: $this->verifierReturning(['org' => 42, 'scopes' => ['ingest:submissions'], 'jti' => 'jti-1']),
            active: true,
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($this->handlerCalled);
        self::assertSame(42, $this->orgId->get(), 'org holder is set from the token org claim');
    }

    // (ii)
    public function test_valid_bearer_without_required_scope_is_403(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('Authorization', 'Bearer good'),
            verifier: $this->verifierReturning(['org' => 42, 'scopes' => ['something:else'], 'jti' => 'jti-1']),
            active: true,
        );

        self::assertSame(403, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    // (iii)
    public function test_revoked_token_is_401(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('Authorization', 'Bearer good'),
            verifier: $this->verifierReturning(['org' => 42, 'scopes' => ['ingest:submissions'], 'jti' => 'jti-dead']),
            active: false,
        );

        self::assertSame(401, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    // (iv) malformed → 401 and does NOT fall through to the static key
    public function test_malformed_bearer_is_401_and_does_not_fall_through(): void
    {
        $response = $this->dispatch(
            $this->post()
                ->withHeader('Authorization', 'Bearer bad')
                ->withHeader('X-NENE2-API-Key', self::STATIC_KEY), // valid static key present
            verifier: $this->verifierThrowing(),
            active: true,
        );

        self::assertSame(401, $response->getStatusCode(), 'a bad Bearer must not fall back to the valid static key');
        self::assertFalse($this->handlerCalled);
    }

    // (iv) no-jti → 401 (never exempt from revocation)
    public function test_bearer_without_jti_is_401(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('Authorization', 'Bearer good'),
            verifier: $this->verifierReturning(['org' => 42, 'scopes' => ['ingest:submissions']]), // no jti
            active: true,
        );

        self::assertSame(401, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    // (iv) an operator JWT (no scopes claim) is not a service principal → 403
    public function test_non_service_principal_is_403(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('Authorization', 'Bearer good'),
            verifier: $this->verifierReturning(['uid' => 1, 'role' => 'admin', 'org_id' => 42]),
            active: true,
        );

        self::assertSame(403, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    // (v) both headers present → Bearer path commits (proven by using an INVALID static key)
    public function test_both_headers_present_bearer_wins(): void
    {
        $response = $this->dispatch(
            $this->post()
                ->withHeader('Authorization', 'Bearer good')
                ->withHeader('X-NENE2-API-Key', 'WRONG-static-key'),
            verifier: $this->verifierReturning(['org' => 7, 'scopes' => ['ingest:submissions'], 'jti' => 'jti-1']),
            active: true,
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($this->handlerCalled);
        self::assertSame(7, $this->orgId->get());
    }

    // (vi) static key only, valid → passes (MCP-compatible; org untouched here)
    public function test_valid_static_key_only_passes(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('X-NENE2-API-Key', self::STATIC_KEY),
            verifier: $this->verifierThrowing(),
            active: true,
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($this->handlerCalled);
    }

    // (vi) static key only, invalid → 401
    public function test_invalid_static_key_is_401(): void
    {
        $response = $this->dispatch(
            $this->post()->withHeader('X-NENE2-API-Key', 'nope'),
            verifier: $this->verifierThrowing(),
            active: true,
        );

        self::assertSame(401, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    // (vii) no credentials → 401
    public function test_no_credentials_is_401(): void
    {
        $response = $this->dispatch($this->post(), verifier: $this->verifierThrowing(), active: true);

        self::assertSame(401, $response->getStatusCode());
        self::assertFalse($this->handlerCalled);
    }

    public function test_other_paths_pass_through_untouched(): void
    {
        // A request to a different /api path is not owned here — it passes straight through
        // (the NENE2 static-key gate already handled it upstream).
        $request = (new Psr17Factory())->createServerRequest('GET', '/api/forms');
        $response = $this->dispatch($request, verifier: $this->verifierThrowing(), active: true);

        self::assertSame(200, $response->getStatusCode());
        self::assertTrue($this->handlerCalled);
    }

    public function test_get_ingest_path_with_bearer_is_403(): void
    {
        // GET on the ingest path (MCP list) is not a service-token route → no scope → 403.
        $request = (new Psr17Factory())->createServerRequest('GET', '/api/submissions')
            ->withHeader('Authorization', 'Bearer good');
        $response = $this->dispatch(
            $request,
            verifier: $this->verifierReturning(['org' => 1, 'scopes' => ['ingest:submissions'], 'jti' => 'j']),
            active: true,
        );

        self::assertSame(403, $response->getStatusCode());
    }

    private function post(): ServerRequestInterface
    {
        return (new Psr17Factory())->createServerRequest('POST', '/api/submissions');
    }

    private function dispatch(ServerRequestInterface $request, TokenVerifierInterface $verifier, bool $active): ResponseInterface
    {
        $psr17 = new Psr17Factory();
        $authorizer = new class ($active) implements ServiceTokenAuthorizerInterface {
            public function __construct(private bool $active)
            {
            }

            public function isActive(string $jti): bool
            {
                return $this->active;
            }
        };

        $middleware = new ServiceApiAuthMiddleware(
            new ProblemDetailsResponseFactory($psr17, $psr17, 'https://nene-contact.dev/problems/'),
            $verifier,
            $this->orgId,
            $authorizer,
            self::STATIC_KEY,
        );

        $handler = new class () implements RequestHandlerInterface {
            public bool $called = false;

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                $this->called = true;

                return new Response(200);
            }
        };

        $response = $middleware->process($request, $handler);
        $this->handlerCalled = $handler->called;

        return $response;
    }

    /**
     * @param array<string, mixed> $claims
     */
    private function verifierReturning(array $claims): TokenVerifierInterface
    {
        return new class ($claims) implements TokenVerifierInterface {
            /** @param array<string, mixed> $claims */
            public function __construct(private array $claims)
            {
            }

            public function verify(string $token): array
            {
                return $this->claims;
            }
        };
    }

    private function verifierThrowing(): TokenVerifierInterface
    {
        return new class () implements TokenVerifierInterface {
            public function verify(string $token): array
            {
                throw new TokenVerificationException('bad token');
            }
        };
    }
}
