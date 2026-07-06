<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonResponseFactory;
use Nene2\Http\PaginationQueryParser;
use Nene2\Http\PaginationResponse;
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
        $pagination = PaginationQueryParser::parse($request);

        $params = $request->getQueryParams();
        $includePii = IncludePii::fromQuery($params);

        $result = $this->useCase->execute($pagination->limit, $pagination->offset, $includePii);

        $body = (new PaginationResponse(
            items: array_map(
                static fn (Submission $s): array => ApiSubmissionResponse::toArray($s, $includePii),
                $result->items,
            ),
            limit: $result->limit,
            offset: $result->offset,
            total: $result->total,
        ))->toArray();
        $body['pii_included'] = $includePii;

        return $this->response->create($body);
    }
}
