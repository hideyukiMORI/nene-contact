<?php

declare(strict_types=1);

namespace NeneContact\Tests\Upstream;

use NeneContact\Upstream\HttpInvoiceClient;
use NeneContact\Upstream\UpstreamRequestException;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;

final class HttpInvoiceClientTest extends TestCase
{
    private function client(Response $response): CapturingHttpClient
    {
        return new CapturingHttpClient($response);
    }

    public function test_posts_bearer_payload_and_returns_client_id(): void
    {
        $http = $this->client(new Response(201, ['Content-Type' => 'application/json'], '{"id":"cli_42"}'));
        $client = new HttpInvoiceClient($http, new Psr17Factory(), 'https://invoice.example.com/', 'svc_token_secret');

        $id = $client->createDraftClient('9', ['source' => 'nene-contact', 'fields' => ['email' => 'visitor@example.com']]);

        self::assertSame('cli_42', $id);
        self::assertNotNull($http->request);
        self::assertSame('POST', $http->request->getMethod());
        self::assertSame('https://invoice.example.com/api/clients/draft', (string) $http->request->getUri());
        self::assertSame('Bearer svc_token_secret', $http->request->getHeaderLine('Authorization'));
        self::assertSame('9', $http->request->getHeaderLine('Idempotency-Key'));

        $body = (string) $http->request->getBody();
        self::assertStringContainsString('"external_reference":"9"', $body);
        self::assertStringContainsString('visitor@example.com', $body);
    }

    public function test_accepts_client_id_field_and_numeric_id(): void
    {
        $http = $this->client(new Response(200, [], '{"client_id":777}'));
        $client = new HttpInvoiceClient($http, new Psr17Factory(), 'https://invoice.example.com', 'tok');

        self::assertSame('777', $client->createDraftClient('9', []));
    }

    public function test_throws_when_not_configured(): void
    {
        $http = $this->client(new Response(200, [], '{"id":"x"}'));
        $client = new HttpInvoiceClient($http, new Psr17Factory(), '', '');

        $this->expectException(UpstreamRequestException::class);
        $client->createDraftClient('9', []);
    }

    public function test_throws_on_error_status(): void
    {
        $http = $this->client(new Response(409, [], 'conflict'));
        $client = new HttpInvoiceClient($http, new Psr17Factory(), 'https://invoice.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $this->expectExceptionMessage('Invoice handoff failed with status 409.');
        $client->createDraftClient('9', []);
    }

    public function test_throws_when_response_has_no_id(): void
    {
        $http = $this->client(new Response(200, [], '{"ok":true}'));
        $client = new HttpInvoiceClient($http, new Psr17Factory(), 'https://invoice.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $client->createDraftClient('9', []);
    }
}
