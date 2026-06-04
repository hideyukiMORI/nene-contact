<?php

declare(strict_types=1);

/**
 * Local MCP (stdio, JSON-RPC 2.0) server for NeNe Contact.
 *
 * Exposes the Contact agent read surface `/api/*` as MCP tools (catalog: docs/mcp/tools.json),
 * mapping each tool to a Contact OpenAPI operation only — never a sibling database (ADR 0002).
 * Tools are redacted by default; `include_pii=true` is audit-logged server-side (charter §11).
 *
 * Environment:
 *   NENE_CONTACT_API_BASE_URL  Base URL of the running Contact app (default http://localhost:8900).
 *   NENE2_MACHINE_API_KEY      Machine API key; required to reach `/api/*` (sent as X-NENE2-API-Key).
 *
 * Run: php tools/local-mcp-server.php   (speaks JSON-RPC over stdin/stdout)
 */

use Nene2\Mcp\LocalMcpException;
use Nene2\Mcp\LocalMcpServer;
use Nene2\Mcp\LocalMcpToolCatalog;
use NeneContact\Mcp\MachineApiKeyMcpHttpClient;

require dirname(__DIR__) . '/vendor/autoload.php';

$root = dirname(__DIR__);

$envValue = static function (string $key): ?string {
    $value = $_SERVER[$key] ?? $_ENV[$key] ?? getenv($key);

    return is_string($value) && $value !== '' ? $value : null;
};

$apiBaseUrl = $envValue('NENE_CONTACT_API_BASE_URL') ?? 'http://localhost:8900';
$machineApiKey = $envValue('NENE2_MACHINE_API_KEY');

$server = new LocalMcpServer(
    new LocalMcpToolCatalog($root . '/docs/mcp/tools.json'),
    new MachineApiKeyMcpHttpClient($machineApiKey),
    $apiBaseUrl,
);

while (($line = fgets(STDIN)) !== false) {
    $line = trim($line);

    if ($line === '') {
        continue;
    }

    try {
        $message = json_decode($line, true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($message)) {
            throw new LocalMcpException('JSON-RPC message must be an object.');
        }

        $response = $server->handle($message);

        if ($response === null) {
            continue;
        }
    } catch (Throwable $exception) {
        $response = [
            'jsonrpc' => '2.0',
            'id' => null,
            'error' => [
                'code' => -32700,
                'message' => $exception->getMessage(),
            ],
        ];
    }

    fwrite(STDOUT, json_encode($response, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL);
}
