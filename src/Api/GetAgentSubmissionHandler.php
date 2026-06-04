<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/submissions/{id} — one submission for AI agents. Redacted by default;
 * `include_pii=true` returns raw values and is audited (charter §11).
 */
final readonly class GetAgentSubmissionHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetAgentSubmissionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);
        $includePii = IncludePii::fromQuery($request->getQueryParams());

        return $this->response->create(
            ApiSubmissionResponse::toArray($this->useCase->execute($id, $includePii), $includePii),
        );
    }
}
