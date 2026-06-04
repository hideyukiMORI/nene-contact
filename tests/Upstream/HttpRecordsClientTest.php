<?php

declare(strict_types=1);

namespace NeneContact\Tests\Upstream;

use NeneContact\Upstream\HttpRecordsClient;
use NeneContact\Upstream\UpstreamRequestException;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase;

final class HttpRecordsClientTest extends TestCase
{
    private function client(Response $response): CapturingHttpClient
    {
        return new CapturingHttpClient($response);
    }

    public function test_fetches_options_with_bearer_token(): void
    {
        $http = $this->client(new Response(200, [], '{"items":[{"value":"jp","label":"Japan"},{"value":"us","label":"United States"}]}'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), 'https://records.example.com/', 'rec_token');

        $options = $client->fetchOptions('countries');

        self::assertSame([
            ['value' => 'jp', 'label' => 'Japan'],
            ['value' => 'us', 'label' => 'United States'],
        ], $options);
        self::assertNotNull($http->request);
        self::assertSame('GET', $http->request->getMethod());
        self::assertSame('https://records.example.com/api/entities/countries/options', (string) $http->request->getUri());
        self::assertSame('Bearer rec_token', $http->request->getHeaderLine('Authorization'));
    }

    public function test_accepts_bare_array_and_defaults_label_to_value(): void
    {
        $http = $this->client(new Response(200, [], '[{"value":"a"},{"value":"b","label":"Bee"}]'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), 'https://records.example.com', 'tok');

        self::assertSame([
            ['value' => 'a', 'label' => 'a'],
            ['value' => 'b', 'label' => 'Bee'],
        ], $client->fetchOptions('x'));
    }

    public function test_skips_malformed_items(): void
    {
        $http = $this->client(new Response(200, [], '{"items":[{"value":"ok"},"nope",{"no_value":1}]}'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), 'https://records.example.com', 'tok');

        self::assertSame([['value' => 'ok', 'label' => 'ok']], $client->fetchOptions('x'));
    }

    public function test_throws_when_not_configured(): void
    {
        $http = $this->client(new Response(200, [], '{"items":[]}'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), '', '');

        $this->expectException(UpstreamRequestException::class);
        $client->fetchOptions('x');
    }

    public function test_throws_on_error_status(): void
    {
        $http = $this->client(new Response(404, [], 'not found'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), 'https://records.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $this->expectExceptionMessage('Records request failed with status 404.');
        $client->fetchOptions('missing');
    }

    public function test_throws_on_non_json(): void
    {
        $http = $this->client(new Response(200, [], 'not json'));
        $client = new HttpRecordsClient($http, new Psr17Factory(), 'https://records.example.com', 'tok');

        $this->expectException(UpstreamRequestException::class);
        $client->fetchOptions('x');
    }
}
