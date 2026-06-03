<?php

declare(strict_types=1);

namespace NeneContact\Tests\RateLimit;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneContact\RateLimit\PublicSubmitThrottleMiddleware;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class PublicSubmitThrottleMiddlewareTest extends TestCase
{
    private function middleware(): PublicSubmitThrottleMiddleware
    {
        $storage = new class () implements RateLimitStorageInterface {
            /** @var array<string, int> */
            private array $counts = [];

            /** @return array{count: int, reset_at: int} */
            public function hit(string $key, int $windowSeconds): array
            {
                $this->counts[$key] = ($this->counts[$key] ?? 0) + 1;

                return ['count' => $this->counts[$key], 'reset_at' => time() + $windowSeconds];
            }
        };

        $psr17 = new Psr17Factory();

        return new PublicSubmitThrottleMiddleware($storage, new ProblemDetailsResponseFactory($psr17, $psr17, 'https://nene-contact.dev/problems/'));
    }

    private function handler(): RequestHandlerInterface
    {
        return new class () implements RequestHandlerInterface {
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return (new Psr17Factory())->createResponse(200);
            }
        };
    }

    private function submit(string $ip): ServerRequestInterface
    {
        return (new Psr17Factory())->createServerRequest('POST', '/public/forms/abc/submissions', ['REMOTE_ADDR' => $ip]);
    }

    public function test_non_submit_route_passes_through(): void
    {
        $request = (new Psr17Factory())->createServerRequest('GET', '/health');
        $response = $this->middleware()->process($request, $this->handler());

        self::assertSame(200, $response->getStatusCode());
    }

    public function test_submit_under_limit_passes_then_429_over_limit(): void
    {
        $mw = $this->middleware();

        // PER_IP_LIMIT = 20: first 20 pass, 21st is throttled.
        for ($i = 1; $i <= 20; $i++) {
            self::assertSame(200, $mw->process($this->submit('9.9.9.9'), $this->handler())->getStatusCode(), "request {$i}");
        }

        $blocked = $mw->process($this->submit('9.9.9.9'), $this->handler());
        self::assertSame(429, $blocked->getStatusCode());
        self::assertNotSame('', $blocked->getHeaderLine('Retry-After'));
    }
}
