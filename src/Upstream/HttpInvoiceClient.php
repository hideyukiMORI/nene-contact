<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

use JsonException;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Throwable;

/**
 * PSR-18 client for the NeNe Invoice draft-client endpoint. Configured from
 * `NENE_INVOICE_API_BASE_URL` + `NENE_INVOICE_SERVICE_TOKEN`; the token is sent as a bearer
 * credential and is never logged or echoed into error messages (M6, charter §6).
 *
 * Idempotency: the submission id travels both as the `external_reference` body field and the
 * `Idempotency-Key` header, so a retry never creates a duplicate draft client.
 */
final readonly class HttpInvoiceClient implements InvoiceClientInterface
{
    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
        private string $baseUrl,
        private string $serviceToken,
    ) {
    }

    public function createDraftClient(string $externalReference, array $payload): string
    {
        $base = rtrim($this->baseUrl, '/');
        if ($base === '' || $this->serviceToken === '') {
            throw new UpstreamRequestException('Invoice handoff is not configured (set NENE_INVOICE_API_BASE_URL and NENE_INVOICE_SERVICE_TOKEN).');
        }

        try {
            $body = json_encode(
                ['external_reference' => $externalReference] + $payload,
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            );
        } catch (JsonException $e) {
            throw new UpstreamRequestException('Invoice handoff payload could not be encoded: ' . $e->getMessage());
        }

        $request = $this->psr17->createRequest('POST', $base . '/api/clients/draft')
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Accept', 'application/json')
            ->withHeader('Authorization', 'Bearer ' . $this->serviceToken)
            ->withHeader('Idempotency-Key', $externalReference)
            ->withBody($this->psr17->createStream($body));

        try {
            $response = $this->http->sendRequest($request);
        } catch (ClientExceptionInterface $e) {
            throw new UpstreamRequestException('Invoice handoff transport error: ' . $e->getMessage());
        }

        $status = $response->getStatusCode();
        if ($status >= 400) {
            throw new UpstreamRequestException('Invoice handoff failed with status ' . $status . '.');
        }

        return $this->extractClientId((string) $response->getBody());
    }

    private function extractClientId(string $body): string
    {
        try {
            $decoded = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new UpstreamRequestException('Invoice handoff returned a non-JSON response.');
        }

        if (!is_array($decoded)) {
            throw new UpstreamRequestException('Invoice handoff returned an unexpected response shape.');
        }

        // Accept {"id": ...} or {"client_id": ...}; coerce numeric ids to string.
        $id = $decoded['client_id'] ?? $decoded['id'] ?? null;
        if (is_int($id)) {
            $id = (string) $id;
        }

        if (!is_string($id) || $id === '') {
            throw new UpstreamRequestException('Invoice handoff response did not include a client id.');
        }

        return $id;
    }
}
