<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `DELETE /admin/tags/{id}` (ADR 0019) — soft-deletes a tag in the caller's organization.
 * Idempotent: re-deleting an already-deleted tag still 204s. Gated by ManageSettings.
 */
final readonly class DeleteTagHandler implements RequestHandlerInterface
{
    public function __construct(
        private DeleteTagUseCaseInterface $useCase,
        private JsonResponseFactory $json,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = is_array($params) && isset($params['id']) ? (int) $params['id'] : 0;

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $this->useCase->execute($actorUserId, $id);

        return $this->json->createEmpty(204);
    }
}
