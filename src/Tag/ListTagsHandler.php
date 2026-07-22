<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
use Nene2\Http\PaginationResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `GET /admin/tags` (ADR 0019) — lists the org's tag vocabulary (non-deleted), ordered by
 * sort_order then label. Gated by ManageSettings.
 */
final readonly class ListTagsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListTagsUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $pagination = PaginationQueryParser::parse($request, 100);

        $result = $this->useCase->execute($pagination->limit, $pagination->offset);

        return $this->json->create((new PaginationResponse(
            items: array_map(
                static fn (Tag $t): array => TagResponse::toArray($t),
                $result->items,
            ),
            limit: $pagination->limit,
            offset: $pagination->offset,
            total: $result->total,
        ))->toArray());
    }
}
