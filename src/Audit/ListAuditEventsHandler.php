<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListAuditEventsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListAuditEventsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit = max(1, min(100, (int) ($params['limit'] ?? 20)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        $result = $this->useCase->execute($limit, $offset);

        return $this->response->create([
            'items' => array_map(
                static fn (AuditEvent $e): array => AuditEventResponse::toArray($e),
                $result->items,
            ),
            'limit' => $result->limit,
            'offset' => $result->offset,
            'total' => $result->total,
        ]);
    }
}
