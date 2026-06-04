<?php

declare(strict_types=1);

namespace NeneContact\Tests\Mcp;

use Nene2\Mcp\LocalMcpServer;
use Nene2\Mcp\LocalMcpToolCatalog;
use PHPUnit\Framework\TestCase;

final class LocalMcpServerTest extends TestCase
{
    private function server(FakeMcpHttpClient $client): LocalMcpServer
    {
        return new LocalMcpServer(
            new LocalMcpToolCatalog(dirname(__DIR__, 2) . '/docs/mcp/tools.json'),
            $client,
            'http://contact.test',
        );
    }

    public function test_initialize_reports_server_info(): void
    {
        $response = $this->server(new FakeMcpHttpClient())->handle(['jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize']);

        self::assertNotNull($response);
        self::assertSame('2.0', $response['jsonrpc']);
        self::assertArrayHasKey('result', $response);
        self::assertArrayHasKey('serverInfo', $response['result']);
    }

    public function test_tools_list_exposes_read_only_tools(): void
    {
        $response = $this->server(new FakeMcpHttpClient())->handle(['jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list']);

        self::assertNotNull($response);
        $tools = $response['result']['tools'];
        self::assertCount(3, $tools);
        foreach ($tools as $tool) {
            self::assertTrue($tool['annotations']['readOnlyHint']);
        }
    }

    public function test_tools_call_interpolates_path_and_passes_query(): void
    {
        $client = new FakeMcpHttpClient(200, '{"id":6,"pii_included":true}');
        $response = $this->server($client)->handle([
            'jsonrpc' => '2.0',
            'id' => 3,
            'method' => 'tools/call',
            'params' => ['name' => 'contact_get_submission', 'arguments' => ['id' => 6, 'include_pii' => true]],
        ]);

        self::assertNotNull($response);
        self::assertSame('GET', $client->lastMethod);
        self::assertSame('/api/submissions/6?include_pii=1', $client->lastPath);
        self::assertFalse($response['result']['isError']);
        self::assertSame(6, $response['result']['structuredContent']['body']['id']);
        self::assertSame('agentGetSubmission', $response['result']['structuredContent']['operationId']);
    }

    public function test_tools_call_list_submissions_hits_collection_path(): void
    {
        $client = new FakeMcpHttpClient(200, '{"items":[]}');
        $this->server($client)->handle([
            'jsonrpc' => '2.0',
            'id' => 4,
            'method' => 'tools/call',
            'params' => ['name' => 'contact_list_submissions', 'arguments' => []],
        ]);

        self::assertSame('/api/submissions', $client->lastPath);
    }

    public function test_unknown_tool_returns_error(): void
    {
        $response = $this->server(new FakeMcpHttpClient())->handle([
            'jsonrpc' => '2.0',
            'id' => 5,
            'method' => 'tools/call',
            'params' => ['name' => 'contact_delete_everything', 'arguments' => []],
        ]);

        self::assertNotNull($response);
        self::assertArrayHasKey('error', $response);
    }

    public function test_upstream_error_status_is_flagged(): void
    {
        $client = new FakeMcpHttpClient(401, '{"title":"Unauthorized"}');
        $response = $this->server($client)->handle([
            'jsonrpc' => '2.0',
            'id' => 6,
            'method' => 'tools/call',
            'params' => ['name' => 'contact_list_forms', 'arguments' => []],
        ]);

        self::assertNotNull($response);
        self::assertTrue($response['result']['isError']);
    }
}
