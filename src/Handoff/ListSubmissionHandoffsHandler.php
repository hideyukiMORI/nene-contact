<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/** GET /admin/submissions/{id}/handoffs — list the handoff links for a submission. */
final readonly class ListSubmissionHandoffsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListSubmissionHandoffsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($parameters['id'] ?? 0);

        return $this->response->create([
            'items' => array_map(
                static fn (SubmissionLink $link): array => SubmissionLinkResponse::toArray($link),
                $this->useCase->execute($submissionId),
            ),
        ]);
    }
}
