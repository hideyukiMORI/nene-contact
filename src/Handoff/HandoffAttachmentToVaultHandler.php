<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /admin/submissions/{id}/handoffs/vault/{attachmentId} — trigger or retry the Vault
 * archive of one attachment. Always 200 with the resulting link; `handoff_status` reflects
 * the outcome (`succeeded` or `failed`), so the admin UI reads the status and offers retry.
 */
final readonly class HandoffAttachmentToVaultHandler implements RequestHandlerInterface
{
    public function __construct(
        private HandoffAttachmentToVaultUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);
        $attachmentId = (int) ($parameters['attachmentId'] ?? 0);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        return $this->response->create(SubmissionLinkResponse::toArray($this->useCase->execute($actorUserId, $id, $attachmentId)));
    }
}
