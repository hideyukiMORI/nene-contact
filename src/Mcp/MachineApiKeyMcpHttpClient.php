<?php

declare(strict_types=1);

namespace NeneContact\Mcp;

use Nene2\Mcp\LocalMcpException;
use Nene2\Mcp\LocalMcpHttpClientInterface;
use Nene2\Mcp\LocalMcpHttpResponse;

/**
 * HTTP transport for the local MCP server that authenticates against the Contact agent
 * surface `/api/*` with the machine API key header (`X-NENE2-API-Key`, env
 * `NENE2_MACHINE_API_KEY`) rather than a bearer JWT. The MCP server only maps to Contact
 * OpenAPI operations (ADR 0002) — never a sibling database.
 */
final readonly class MachineApiKeyMcpHttpClient implements LocalMcpHttpClientInterface
{
    public function __construct(private ?string $machineApiKey = null)
    {
    }

    public function get(string $baseUrl, string $path): LocalMcpHttpResponse
    {
        return $this->request('GET', $baseUrl, $path, null);
    }

    /** @param array<string, mixed> $body */
    public function post(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->request('POST', $baseUrl, $path, $body);
    }

    /** @param array<string, mixed> $body */
    public function put(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->request('PUT', $baseUrl, $path, $body);
    }

    /** @param array<string, mixed> $body */
    public function patch(string $baseUrl, string $path, array $body): LocalMcpHttpResponse
    {
        return $this->request('PATCH', $baseUrl, $path, $body);
    }

    public function delete(string $baseUrl, string $path): LocalMcpHttpResponse
    {
        return $this->request('DELETE', $baseUrl, $path, null);
    }

    public function hasAuthentication(): bool
    {
        return $this->machineApiKey !== null;
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function request(string $method, string $baseUrl, string $path, ?array $body): LocalMcpHttpResponse
    {
        $headers = ['Accept: application/json'];

        if ($this->machineApiKey !== null) {
            $headers[] = 'X-NENE2-API-Key: ' . $this->machineApiKey;
        }

        $content = null;

        if ($body !== null) {
            $content = json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            $headers[] = 'Content-Type: application/json';
        }

        $options = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'ignore_errors' => true,
                'timeout' => 10,
            ],
        ];

        if ($content !== null) {
            $options['http']['content'] = $content;
        }

        $context = stream_context_create($options);
        $url = rtrim($baseUrl, '/') . $path;
        $responseBody = @file_get_contents($url, false, $context);

        if ($responseBody === false) {
            throw new LocalMcpException(sprintf('Contact API request failed for "%s".', $url));
        }

        return new LocalMcpHttpResponse(
            $this->statusCode($http_response_header),
            $this->headers($http_response_header),
            $responseBody,
        );
    }

    /**
     * @param list<string> $responseHeaders
     */
    private function statusCode(array $responseHeaders): int
    {
        $statusLine = $responseHeaders[0] ?? '';

        if (preg_match('/\AHTTP\/\S+\s+(\d{3})\b/', $statusLine, $matches) !== 1) {
            throw new LocalMcpException('Contact API response did not include an HTTP status line.');
        }

        return (int) $matches[1];
    }

    /**
     * @param list<string> $responseHeaders
     *
     * @return array<string, string>
     */
    private function headers(array $responseHeaders): array
    {
        $headers = [];

        foreach ($responseHeaders as $header) {
            if (!str_contains($header, ':')) {
                continue;
            }

            [$name, $value] = explode(':', $header, 2);
            $headers[strtolower(trim($name))] = trim($value);
        }

        return $headers;
    }
}
