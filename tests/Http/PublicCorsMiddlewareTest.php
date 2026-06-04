<?php

declare(strict_types=1);

namespace NeneContact\Tests\Http;

use NeneContact\ContactForm\ContactForm;
use NeneContact\Http\PublicCorsMiddleware;
use NeneContact\Submission\PublicFormReaderInterface;
use Nyholm\Psr7\Response;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class PublicCorsMiddlewareTest extends TestCase
{
    /** @param list<string> $allowedOrigins */
    private function middleware(array $allowedOrigins): PublicCorsMiddleware
    {
        $reader = new class ($allowedOrigins) implements PublicFormReaderInterface {
            /** @param list<string> $allowedOrigins */
            public function __construct(private array $allowedOrigins)
            {
            }

            public function findByPublicFormKey(string $publicFormKey): ContactForm
            {
                return new ContactForm(
                    organizationId: 7,
                    name: 'F',
                    publicFormKey: $publicFormKey,
                    defaultLocale: 'ja',
                    locales: ['ja'],
                    allowedOrigins: $this->allowedOrigins,
                    fields: [],
                    status: 'active',
                    id: 3,
                );
            }
        };

        return new PublicCorsMiddleware($reader);
    }

    private function passthrough(): RequestHandlerInterface
    {
        return new class () implements RequestHandlerInterface {
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return new Response(200);
            }
        };
    }

    private function publicRequest(string $method, string $origin): ServerRequest
    {
        $request = new ServerRequest($method, '/public/forms/k/submissions');

        return $origin === '' ? $request : $request->withHeader('Origin', $origin);
    }

    public function test_reflects_allowed_origin_on_actual_response(): void
    {
        $response = $this->middleware(['https://ops.example.com'])
            ->process($this->publicRequest('POST', 'https://ops.example.com'), $this->passthrough());

        self::assertSame('https://ops.example.com', $response->getHeaderLine('Access-Control-Allow-Origin'));
        self::assertSame('Origin', $response->getHeaderLine('Vary'));
    }

    public function test_disallowed_origin_gets_no_acao(): void
    {
        $response = $this->middleware(['https://ops.example.com'])
            ->process($this->publicRequest('GET', 'https://evil.example.com'), $this->passthrough());

        self::assertSame('', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function test_empty_allowlist_is_open_and_echoes_origin(): void
    {
        $response = $this->middleware([])
            ->process($this->publicRequest('GET', 'https://anywhere.example.com'), $this->passthrough());

        self::assertSame('https://anywhere.example.com', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function test_non_public_path_is_untouched(): void
    {
        $request = (new ServerRequest('GET', '/admin/submissions'))->withHeader('Origin', 'https://ops.example.com');

        $response = $this->middleware([])->process($request, $this->passthrough());

        self::assertSame('', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function test_no_origin_header_is_untouched(): void
    {
        $response = $this->middleware([])->process($this->publicRequest('GET', ''), $this->passthrough());

        self::assertSame('', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }
}
