<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/submissions/{id}/technical-meta — discloses IP / User-Agent on explicit operator
 * action (abuse investigation, ADR 0018). Gated by ViewSubmissionTechnicalMeta (admin+); the
 * use case records the audited disclosure. Kept off the default detail payload by design.
 */
final readonly class GetSubmissionTechnicalMetaHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetSubmissionTechnicalMetaUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        return $this->response->create(SubmissionResponse::toTechnicalMeta($this->useCase->execute($actorUserId, $id)));
    }
}
