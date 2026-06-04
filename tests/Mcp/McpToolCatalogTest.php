<?php

declare(strict_types=1);

namespace NeneContact\Tests\Mcp;

use Nene2\Mcp\LocalMcpToolCatalog;
use PHPUnit\Framework\TestCase;

final class McpToolCatalogTest extends TestCase
{
    private function catalog(): LocalMcpToolCatalog
    {
        return new LocalMcpToolCatalog(dirname(__DIR__, 2) . '/docs/mcp/tools.json');
    }

    public function test_catalog_loads_the_read_tools(): void
    {
        $tools = $this->catalog()->tools();
        $names = array_map(static fn (array $t): string => $t['name'], $tools);

        self::assertContains('contact_list_forms', $names);
        self::assertContains('contact_list_submissions', $names);
        self::assertContains('contact_get_submission', $names);
    }

    public function test_all_tools_are_read_only_and_map_to_openapi(): void
    {
        foreach ($this->catalog()->tools() as $tool) {
            self::assertSame('read', $tool['safety'], $tool['name'] . ' must be read-only for this slice');
            self::assertSame('openapi', $tool['source']['type']);
            self::assertStringStartsWith('/api/', $tool['source']['path']);
        }
    }

    public function test_find_returns_tool_by_name(): void
    {
        $tool = $this->catalog()->find('contact_get_submission');

        self::assertNotNull($tool);
        self::assertSame('GET', $tool['source']['method']);
        self::assertSame('/api/submissions/{id}', $tool['source']['path']);
        self::assertContains('id', $tool['inputSchema']['required']);
    }
}
