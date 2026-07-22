<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `DELETE /admin/submissions/{id}/tags/{tagId}` (ADR 0019) — removes a tag from the submission.
 * Idempotent → 204. Gated by ManageSubmissions.
 */
final readonly class RemoveSubmissionTagHandler implements RequestHandlerInterface
{
    public function __construct(
        private RemoveSubmissionTagUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($params['id'] ?? 0);
        $tagId = (int) ($params['tagId'] ?? 0);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $this->useCase->execute($actorUserId, $submissionId, $tagId);

        return $this->json->createEmpty(204);
    }
}
