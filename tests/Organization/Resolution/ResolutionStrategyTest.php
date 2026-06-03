<?php

declare(strict_types=1);

namespace NeneContact\Tests\Organization\Resolution;

use NeneContact\Organization\Resolution\CustomDomainResolutionStrategy;
use NeneContact\Organization\Resolution\EnvResolutionStrategy;
use NeneContact\Organization\Resolution\PathPrefixResolutionStrategy;
use NeneContact\Organization\Resolution\SubdomainResolutionStrategy;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class ResolutionStrategyTest extends TestCase
{
    private function request(string $uri): ServerRequestInterface
    {
        return (new Psr17Factory())->createServerRequest('GET', $uri);
    }

    public function test_env_strategy_returns_configured_slug(): void
    {
        self::assertSame('acme', (new EnvResolutionStrategy('acme'))->resolve($this->request('https://x/admin/forms')));
        self::assertNull((new EnvResolutionStrategy(''))->resolve($this->request('https://x/admin/forms')));
    }

    public function test_path_prefix_strategy_uses_first_segment(): void
    {
        self::assertSame('acme', (new PathPrefixResolutionStrategy())->resolve($this->request('https://x/acme/admin/forms')));
        self::assertNull((new PathPrefixResolutionStrategy())->resolve($this->request('https://x/')));
    }

    public function test_subdomain_strategy_extracts_subdomain(): void
    {
        $s = new SubdomainResolutionStrategy('example.com');
        self::assertSame('org1', $s->resolve($this->request('https://org1.example.com/admin/forms')));
        self::assertNull($s->resolve($this->request('https://example.com/admin/forms')));
    }

    public function test_custom_domain_strategy_returns_host(): void
    {
        self::assertSame('forms.acme.co', (new CustomDomainResolutionStrategy())->resolve($this->request('https://forms.acme.co/admin')));
    }
}
