<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

use JsonException;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Throwable;

/**
 * PSR-18 client for the NeNe Vault document-archive endpoint. Configured from
 * `NENE_VAULT_API_BASE_URL` + `NENE_VAULT_SERVICE_TOKEN`; the token is sent as a bearer
 * credential and is never logged or echoed into error messages (M5, charter §6).
 *
 * The attachment bytes are uploaded as `multipart/form-data` (field `file`), with the
 * idempotency key in both the `external_reference` field and the `Idempotency-Key` header so
 * a retry never creates a duplicate document (DO D12).
 */
final readonly class HttpVaultClient implements VaultClientInterface
{
    public function __construct(
        private ClientInterface $http,
        private Psr17Factory $psr17,
        private string $baseUrl,
        private string $serviceToken,
    ) {
    }

    public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string
    {
        $base = rtrim($this->baseUrl, '/');
        if ($base === '' || $this->serviceToken === '') {
            throw new UpstreamRequestException('Vault handoff is not configured (set NENE_VAULT_API_BASE_URL and NENE_VAULT_SERVICE_TOKEN).');
        }

        try {
            $metadataJson = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new UpstreamRequestException('Vault handoff metadata could not be encoded: ' . $e->getMessage());
        }

        $boundary = '----nenecontact' . bin2hex(random_bytes(16));
        $body = $this->multipartBody($boundary, [
            'external_reference' => $externalReference,
            'metadata' => $metadataJson,
        ], $filename, $contentType, $bytes);

        $request = $this->psr17->createRequest('POST', $base . '/api/documents')
            ->withHeader('Content-Type', 'multipart/form-data; boundary=' . $boundary)
            ->withHeader('Accept', 'application/json')
            ->withHeader('Authorization', 'Bearer ' . $this->serviceToken)
            ->withHeader('Idempotency-Key', $externalReference)
            ->withBody($this->psr17->createStream($body));

        try {
            $response = $this->http->sendRequest($request);
        } catch (ClientExceptionInterface $e) {
            throw new UpstreamRequestException('Vault handoff transport error: ' . $e->getMessage());
        }

        $status = $response->getStatusCode();
        if ($status >= 400) {
            throw new UpstreamRequestException('Vault handoff failed with status ' . $status . '.');
        }

        return $this->extractDocumentId((string) $response->getBody());
    }

    /** @param array<string, string> $fields */
    private function multipartBody(string $boundary, array $fields, string $filename, string $contentType, string $bytes): string
    {
        $eol = "\r\n";
        $body = '';

        foreach ($fields as $name => $value) {
            $body .= '--' . $boundary . $eol;
            $body .= 'Content-Disposition: form-data; name="' . $name . '"' . $eol . $eol;
            $body .= $value . $eol;
        }

        $safeName = str_replace('"', '', $filename);
        $body .= '--' . $boundary . $eol;
        $body .= 'Content-Disposition: form-data; name="file"; filename="' . $safeName . '"' . $eol;
        $body .= 'Content-Type: ' . $contentType . $eol . $eol;
        $body .= $bytes . $eol;
        $body .= '--' . $boundary . '--' . $eol;

        return $body;
    }

    private function extractDocumentId(string $body): string
    {
        try {
            $decoded = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new UpstreamRequestException('Vault handoff returned a non-JSON response.');
        }

        if (!is_array($decoded)) {
            throw new UpstreamRequestException('Vault handoff returned an unexpected response shape.');
        }

        // Accept {"id": ...} or {"document_id": ...}; coerce numeric ids to string.
        $id = $decoded['document_id'] ?? $decoded['id'] ?? null;
        if (is_int($id)) {
            $id = (string) $id;
        }

        if (!is_string($id) || $id === '') {
            throw new UpstreamRequestException('Vault handoff response did not include a document id.');
        }

        return $id;
    }
}
