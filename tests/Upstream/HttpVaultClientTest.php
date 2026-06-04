<?php

declare(strict_types=1);

namespace NeneContact\Tests\Upstream;

use NeneContact\Upstream\HttpVaultClient;
use NeneContact\Upstream\UpstreamRequestException;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;

final class HttpVaultClientTest extends TestCase
{
    private function client(Response $response): CapturingHttpClient
    {
        return new CapturingHttpClient($response);
    }

    public function test_uploads_multipart_bearer_payload_and_returns_document_id(): void
    {
        $http = $this->client(new Response(201, ['Content-Type' => 'application/json'], '{"id":"doc_42"}'));
        $client = new HttpVaultClient($http, new Psr17Factory(), 'https://vault.example.com/', 'svc_token_secret');

        $id = $client->archiveDocument('ref-9-7', 'resume.pdf', 'application/pdf', '%PDF-1.7 bytes', ['submission_id' => 9]);

        self::assertSame('doc_42', $id);
        self::assertNotNull($http->request);
        self::assertSame('POST', $http->request->getMethod());
        self::assertSame('https://vault.example.com/api/documents', (string) $http->request->getUri());
        self::assertSame('Bearer svc_token_secret', $http->request->getHeaderLine('Authorization'));
        self::assertSame('ref-9-7', $http->request->getHeaderLine('Idempotency-Key'));
        self::assertStringStartsWith('multipart/form-data; boundary=', $http->request->getHeaderLine('Content-Type'));

        $body = (string) $http->request->getBody();
        self::assertStringContainsString('name="external_reference"', $body);
        self::assertStringContainsString('ref-9-7', $body);
        self::assertStringContainsString('filename="resume.pdf"', $body);
        self::assertStringContainsString('Content-Type: application/pdf', $body);
        self::assertStringContainsString('%PDF-1.7 bytes', $body);
        // The metadata is carried as its own part, not leaked into the file part name.
        self::assertStringContainsString('name="metadata"', $body);
    }

    public function test_accepts_document_id_field_and_numeric_id(): void
    {
        $http = $this->client(new Response(200, [], '{"document_id":555}'));
        $client = new HttpVaultClient($http, new Psr17Factory(), 'https://vault.example.com', 'tok');

        self::assertSame('555', $client->archiveDocument('r', 'f.txt', 'text/plain', 'hi', []));
    }

    public function test_throws_when_not_configured(): void
    {
        $http = $this->client(new Response(200, [], '{"id":"x"}'));
        $client = new HttpVaultClient($http, new Psr17Factory(), '', '');

        $this->expectException(UpstreamRequestException::class);
        $client->archiveDocument('r', 'f.txt', 'text/plain', 'hi', []);
    }

    public function test_throws_on_error_status(): void
    {
        $http = $this->client(new Response(500, [], 'boom'));
        $client = new HttpVaultClient($http, new Psr17Factory(), 'https://vault.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $this->expectExceptionMessage('Vault handoff failed with status 500.');
        $client->archiveDocument('r', 'f.txt', 'text/plain', 'hi', []);
    }

    public function test_throws_when_response_has_no_id(): void
    {
        $http = $this->client(new Response(200, [], '{"ok":true}'));
        $client = new HttpVaultClient($http, new Psr17Factory(), 'https://vault.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $client->archiveDocument('r', 'f.txt', 'text/plain', 'hi', []);
    }
}
