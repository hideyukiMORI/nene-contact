<?php

declare(strict_types=1);

/**
 * MCP catalog gate for `composer mcp`.
 *
 * Validates docs/mcp/tools.json (structure via Nene2\Mcp\LocalMcpToolCatalog) and checks that
 * every tool maps to a real Contact OpenAPI operation — matching operationId, method, and path
 * (ADR 0002: MCP maps to Contact OpenAPI only). Keeps the tool catalog honest with the contract.
 */

require dirname(__DIR__) . '/vendor/autoload.php';

use Nene2\Mcp\LocalMcpToolCatalog;
use Symfony\Component\Yaml\Yaml;

$root = dirname(__DIR__);

/** @var list<string> $errors */
$errors = [];

try {
    $catalog = new LocalMcpToolCatalog($root . '/docs/mcp/tools.json');
    $tools = $catalog->tools();
} catch (\Throwable $e) {
    fwrite(STDERR, 'MCP catalog invalid: ' . $e->getMessage() . "\n");
    exit(1);
}

/** @var array<string, mixed> $doc */
$doc = Yaml::parseFile($root . '/docs/openapi/openapi.yaml');
$paths = is_array($doc['paths'] ?? null) ? $doc['paths'] : [];

// Build operationId => {method, path} from the OpenAPI document.
$operations = [];
foreach ($paths as $path => $methods) {
    if (!is_array($methods)) {
        continue;
    }

    foreach ($methods as $method => $operation) {
        if (!is_array($operation) || !isset($operation['operationId']) || !is_string($operation['operationId'])) {
            continue;
        }

        $operations[$operation['operationId']] = [
            'method' => strtoupper((string) $method),
            'path' => (string) $path,
        ];
    }
}

foreach ($tools as $tool) {
    $name = $tool['name'];

    if ($tool['source']['type'] !== 'openapi') {
        $errors[] = "Tool '{$name}': source.type must be 'openapi'.";

        continue;
    }

    $operationId = $tool['source']['operationId'];

    if (!isset($operations[$operationId])) {
        $errors[] = "Tool '{$name}': operationId '{$operationId}' not found in OpenAPI.";

        continue;
    }

    $op = $operations[$operationId];

    if ($op['method'] !== $tool['source']['method']) {
        $errors[] = "Tool '{$name}': method {$tool['source']['method']} != OpenAPI {$op['method']} for '{$operationId}'.";
    }

    if ($op['path'] !== $tool['source']['path']) {
        $errors[] = "Tool '{$name}': path {$tool['source']['path']} != OpenAPI {$op['path']} for '{$operationId}'.";
    }

    if (!in_array($tool['safety'], ['read', 'write'], true)) {
        $errors[] = "Tool '{$name}': safety must be 'read' or 'write'.";
    }
}

if ($errors !== []) {
    fwrite(STDERR, "MCP catalog errors:\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

fwrite(STDOUT, sprintf("MCP catalog OK — %d tools, all map to OpenAPI operations.\n", count($tools)));
