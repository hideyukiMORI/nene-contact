<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/settings/organization — the caller's own organization settings (name +
 * sender_display_name), for the "組織設定" screen. The org is taken from the token (org_id claim);
 * self-scoped, ManageSettings — distinct from superadmin org management (/admin/organizations).
 */
final readonly class GetOrganizationSettingsHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetOrganizationByIdUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $claims = $request->getAttribute('nene2.auth.claims');
        $callerOrgId = is_array($claims) && isset($claims['org_id']) && is_int($claims['org_id']) ? $claims['org_id'] : null;

        if ($callerOrgId === null) {
            throw new OrganizationNotFoundException(0);
        }

        $output = $this->useCase->execute(new GetOrganizationByIdInput(id: $callerOrgId));

        return $this->response->create([
            'id' => $output->id,
            'name' => $output->name,
            'sender_display_name' => $output->senderDisplayName,
        ]);
    }
}
