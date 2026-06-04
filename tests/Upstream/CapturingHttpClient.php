<?php

declare(strict_types=1);

namespace NeneContact\Tests\Upstream;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/** Test double: captures the last request and returns a canned response. */
final class CapturingHttpClient implements ClientInterface
{
    public ?RequestInterface $request = null;

    public function __construct(private ResponseInterface $response)
    {
    }

    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        $this->request = $request;

        return $this->response;
    }
}
