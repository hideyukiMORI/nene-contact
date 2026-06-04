<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Throwable;

/**
 * PSR-18 client for the NeNe Records entity-options endpoint (read-only). Configured from
 * `NENE_RECORDS_API_BASE_URL` + `NENE_RECORDS_BEARER_TOKEN`; the token is a bearer credential
 * and is never logged or echoed into error messages (M6, charter §6).
 *
 * Reads `GET {base}/api/entities/{source}/options` and normalizes each item to
 * `{value, label}`. Records remains the SSOT for the option list (ADR 0002).
 */
final readonly class HttpRecordsClient implements RecordsClientInterface
{
    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
        private string $baseUrl,
        private string $bearerToken,
    ) {
    }

    public function fetchOptions(string $source): array
    {
        $base = rtrim($this->baseUrl, '/');
        if ($base === '' || $this->bearerToken === '') {
            throw new UpstreamRequestException('Records is not configured (set NENE_RECORDS_API_BASE_URL and NENE_RECORDS_BEARER_TOKEN).');
        }

        $request = $this->psr17->createRequest('GET', $base . '/api/entities/' . rawurlencode($source) . '/options')
            ->withHeader('Accept', 'application/json')
            ->withHeader('Authorization', 'Bearer ' . $this->bearerToken);

        try {
            $response = $this->http->sendRequest($request);
        } catch (ClientExceptionInterface $e) {
            throw new UpstreamRequestException('Records request transport error: ' . $e->getMessage());
        }

        $status = $response->getStatusCode();
        if ($status >= 400) {
            throw new UpstreamRequestException('Records request failed with status ' . $status . '.');
        }

        return $this->parseOptions((string) $response->getBody());
    }

    /** @return list<array{value: string, label: string}> */
    private function parseOptions(string $body): array
    {
        try {
            $decoded = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new UpstreamRequestException('Records returned a non-JSON response.');
        }

        // Accept {"items": [...]} or a bare array of options.
        $items = is_array($decoded) && isset($decoded['items']) && is_array($decoded['items'])
            ? $decoded['items']
            : (is_array($decoded) ? $decoded : null);

        if (!is_array($items)) {
            throw new UpstreamRequestException('Records returned an unexpected response shape.');
        }

        $options = [];
        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['value'])) {
                continue;
            }

            $value = (string) $item['value'];
            // Label falls back to the value when Records omits it.
            $label = isset($item['label']) && is_scalar($item['label']) ? (string) $item['label'] : $value;

            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }
}
