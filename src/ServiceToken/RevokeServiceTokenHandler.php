<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * `DELETE /admin/service-tokens/{id}` (#388) — revokes a service token in the caller's
 * organization. Idempotent: re-revoking an already-revoked token still 204s. Gated by
 * ManageSettings.
 */
final readonly class RevokeServiceTokenHandler implements RequestHandlerInterface
{
    public function __construct(
        private RevokeServiceTokenUseCaseInterface $useCase,
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
