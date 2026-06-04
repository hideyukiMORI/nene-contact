<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonResponseFactory;
use NeneContact\Submission\Submission;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/submissions — list submissions for AI agents. Redacted by default; `include_pii=true`
 * returns raw values and is audited (charter §11).
 */
final readonly class ListAgentSubmissionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListAgentSubmissionsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $limit = max(1, min(100, (int) ($params['limit'] ?? 20)));
        $offset = max(0, (int) ($params['offset'] ?? 0));
        $includePii = IncludePii::fromQuery($params);

        $result = $this->useCase->execute($limit, $offset, $includePii);

        return $this->response->create([
            'items' => array_map(
                static fn (Submission $s): array => ApiSubmissionResponse::toArray($s, $includePii),
                $result->items,
            ),
            'limit' => $result->limit,
            'offset' => $result->offset,
            'total' => $result->total,
            'pii_included' => $includePii,
        ]);
    }
}
