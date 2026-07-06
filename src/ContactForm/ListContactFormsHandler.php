<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
use Nene2\Http\PaginationResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListContactFormsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListContactFormsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $pagination = PaginationQueryParser::parse($request);

        $result = $this->useCase->execute($pagination->limit, $pagination->offset);

        return $this->response->create((new PaginationResponse(
            items: array_map(static fn (ContactForm $f): array => ContactFormResponse::toArray($f), $result->items),
            limit: $result->limit,
            offset: $result->offset,
            total: $result->total,
        ))->toArray());
    }
}
