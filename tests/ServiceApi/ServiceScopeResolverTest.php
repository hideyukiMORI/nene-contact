<?php

declare(strict_types=1);

namespace NeneContact\Tests\ServiceApi;

use NeneContact\ServiceApi\ServiceScope;
use NeneContact\ServiceApi\ServiceScopeResolver;
use PHPUnit\Framework\TestCase;

final class ServiceScopeResolverTest extends TestCase
{
    public function test_post_ingest_maps_to_ingest_scope(): void
    {
        self::assertSame(ServiceScope::IngestSubmissions, ServiceScopeResolver::resolve('/api/submissions', 'POST'));
        self::assertSame(ServiceScope::IngestSubmissions, ServiceScopeResolver::resolve('/api/submissions', 'post'));
    }

    public function test_reads_and_other_paths_map_to_null(): void
    {
        // GET on the same path (MCP list) is not a service-token route.
        self::assertNull(ServiceScopeResolver::resolve('/api/submissions', 'GET'));
        self::assertNull(ServiceScopeResolver::resolve('/api/forms', 'GET'));
        self::assertNull(ServiceScopeResolver::resolve('/api/submissions/5', 'PATCH'));
        self::assertNull(ServiceScopeResolver::resolve('/admin/service-tokens', 'POST'));
    }
}
