<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `POST /admin/submissions/{id}/tags` (ADR 0019) — applies a tag (`{tag_id}`) to the submission.
 * Idempotent → 204. Gated by ManageSubmissions ({@see \NeneContact\Auth\CapabilityResolver}).
 */
final readonly class AddSubmissionTagHandler implements RequestHandlerInterface
{
    public function __construct(
        private AddSubmissionTagUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($params['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $tagId = $body['tag_id'] ?? null;
        if (!is_int($tagId) || $tagId <= 0) {
            throw new ValidationException([new ValidationError('tag_id', 'A tag_id is required.', 'required')]);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $this->useCase->execute($actorUserId, $submissionId, $tagId);

        return $this->json->createEmpty(204);
    }
}
