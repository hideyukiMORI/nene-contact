<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Soft-deletes a submission (data-subject deletion right, charter §4).
 * DELETE /admin/submissions/{id}
 */
final readonly class DeleteSubmissionHandler implements RequestHandlerInterface
{
    public function __construct(
        private DeleteSubmissionUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $this->useCase->execute($actorUserId, $id);

        return $this->response->createEmpty(204);
    }
}
