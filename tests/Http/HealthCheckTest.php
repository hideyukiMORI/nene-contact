<?php

declare(strict_types=1);

namespace NeneContact\Tests\Http;

use NeneContact\Http\RuntimeContainerFactory;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;

final class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $container = (new RuntimeContainerFactory(dirname(__DIR__, 2)))->create();
        $application = $container->get(RequestHandlerInterface::class);
        self::assertInstanceOf(RequestHandlerInterface::class, $application);

        $request = (new Psr17Factory())->createServerRequest('GET', '/health');
        $response = $application->handle($request);

        self::assertSame(200, $response->getStatusCode());

        $payload = json_decode((string) $response->getBody(), true);
        self::assertIsArray($payload);
        self::assertSame('ok', $payload['status'] ?? null);
    }
}
