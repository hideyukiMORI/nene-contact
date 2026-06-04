<?php

declare(strict_types=1);

namespace NeneContact\Tests\Mcp;

use Nene2\Mcp\LocalMcpHttpClientInterface;
use Nene2\Mcp\LocalMcpHttpResponse;

/** Test double: records the last request and returns a canned response. */
final class FakeMcpHttpClient implements LocalMcpHttpClientInterface
{
    public ?string $lastMethod = null;

    public ?string $lastPath = null;

    public function __construct(
        private readonly int $statusCode = 200,
        private readonly string $body = '{"ok":true}',
        private readonly bool $authenticated = true,
    ) {
    }

    public function get(string $baseUrl, string $path): LocalMcpHttpResponse
    {
        return $this->record('GET', $path);
    }

    /** @param array<string, mixed> $body */
    public function post(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->record('POST', $path);
    }

    /** @param array<string, mixed> $body */
    public function put(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->record('PUT', $path);
    }

    /** @param array<string, mixed> $body */
    public function patch(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->record('PATCH', $path);
    }

    public function delete(string $baseUrl, string $path): LocalMcpHttpResponse
    {
        return $this->record('DELETE', $path);
    }

    public function hasAuthentication(): bool
    {
        return $this->authenticated;
    }

    private function record(string $method, string $path): LocalMcpHttpResponse
    {
        $this->lastMethod = $method;
        $this->lastPath = $path;

        return new LocalMcpHttpResponse($this->statusCode, ['x-request-id' => 'req-test'], $this->body);
    }
}
