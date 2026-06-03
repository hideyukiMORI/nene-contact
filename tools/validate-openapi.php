<?php

declare(strict_types=1);

/**
 * Lightweight OpenAPI 3.1 contract gate for `composer openapi`.
 *
 * Validates structure without a heavy external validator: version/info/paths present,
 * every operation has a unique operationId and at least one response, every local
 * `$ref` resolves, and security scheme references exist.
 */

require dirname(__DIR__) . '/vendor/autoload.php';

use Symfony\Component\Yaml\Yaml;

$path = dirname(__DIR__) . '/docs/openapi/openapi.yaml';

/** @var list<string> $errors */
$errors = [];

if (!is_file($path)) {
    fwrite(STDERR, "OpenAPI file not found: {$path}\n");
    exit(1);
}

try {
    /** @var array<string, mixed> $doc */
    $doc = Yaml::parseFile($path);
} catch (\Throwable $e) {
    fwrite(STDERR, 'OpenAPI YAML failed to parse: ' . $e->getMessage() . "\n");
    exit(1);
}

if (!is_array($doc)) {
    fwrite(STDERR, "OpenAPI root must be a mapping.\n");
    exit(1);
}

$version = (string) ($doc['openapi'] ?? '');
if (!str_starts_with($version, '3.')) {
    $errors[] = "openapi version must be 3.x, got '{$version}'.";
}

$info = $doc['info'] ?? null;
if (!is_array($info) || ($info['title'] ?? '') === '' || ($info['version'] ?? '') === '') {
    $errors[] = 'info.title and info.version are required.';
}

$paths = $doc['paths'] ?? null;
if (!is_array($paths) || $paths === []) {
    $errors[] = 'paths must be a non-empty mapping.';
    $paths = [];
}

$methods = ['get', 'post', 'put', 'patch', 'delete'];
/** @var array<string, string> $operationIds */
$operationIds = [];

foreach ($paths as $route => $item) {
    if (!is_array($item)) {
        continue;
    }

    foreach ($methods as $method) {
        if (!isset($item[$method])) {
            continue;
        }

        $op = $item[$method];
        $where = strtoupper($method) . ' ' . $route;

        if (!is_array($op)) {
            $errors[] = "{$where}: operation must be a mapping.";
            continue;
        }

        $operationId = (string) ($op['operationId'] ?? '');
        if ($operationId === '') {
            $errors[] = "{$where}: missing operationId.";
        } elseif (isset($operationIds[$operationId])) {
            $errors[] = "Duplicate operationId '{$operationId}' ({$where} and {$operationIds[$operationId]}).";
        } else {
            $operationIds[$operationId] = $where;
        }

        if (!isset($op['responses']) || !is_array($op['responses']) || $op['responses'] === []) {
            $errors[] = "{$where}: at least one response is required.";
        }
    }
}

// Collect and resolve every local $ref.
$refs = [];
$collect = function (mixed $node, callable $self) use (&$refs): void {
    if (!is_array($node)) {
        return;
    }
    foreach ($node as $key => $value) {
        if ($key === '$ref' && is_string($value)) {
            $refs[] = $value;
        } else {
            $self($value, $self);
        }
    }
};
$collect($doc, $collect);

foreach (array_unique($refs) as $ref) {
    if (!str_starts_with($ref, '#/')) {
        continue; // external refs are out of scope for this gate
    }

    $segments = explode('/', substr($ref, 2));
    $cursor = $doc;
    $ok = true;
    foreach ($segments as $segment) {
        $segment = str_replace(['~1', '~0'], ['/', '~'], $segment);
        if (is_array($cursor) && array_key_exists($segment, $cursor)) {
            $cursor = $cursor[$segment];
        } else {
            $ok = false;
            break;
        }
    }
    if (!$ok) {
        $errors[] = "Unresolved \$ref: {$ref}";
    }
}

// Security scheme references must exist.
$schemes = $doc['components']['securitySchemes'] ?? [];
$schemes = is_array($schemes) ? $schemes : [];
$checkSecurity = function (mixed $security) use (&$errors, $schemes): void {
    if (!is_array($security)) {
        return;
    }
    foreach ($security as $requirement) {
        if (!is_array($requirement)) {
            continue;
        }
        foreach (array_keys($requirement) as $scheme) {
            if (!array_key_exists((string) $scheme, $schemes)) {
                $errors[] = "Security scheme '{$scheme}' is not defined in components.securitySchemes.";
            }
        }
    }
};
$checkSecurity($doc['security'] ?? []);
foreach ($paths as $item) {
    if (!is_array($item)) {
        continue;
    }
    foreach ($methods as $method) {
        if (isset($item[$method]) && is_array($item[$method]) && isset($item[$method]['security'])) {
            $checkSecurity($item[$method]['security']);
        }
    }
}

if ($errors !== []) {
    fwrite(STDERR, "OpenAPI validation failed:\n");
    foreach ($errors as $error) {
        fwrite(STDERR, "  - {$error}\n");
    }
    exit(1);
}

fwrite(STDOUT, 'OpenAPI OK — ' . count($operationIds) . " operations, all \$refs resolve.\n");
exit(0);
