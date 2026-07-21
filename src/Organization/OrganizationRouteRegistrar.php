<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class OrganizationRouteRegistrar
{
    public function __construct(
        private ListOrganizationsHandler $listHandler,
        private GetOrganizationByIdHandler $getHandler,
        private CreateOrganizationHandler $createHandler,
        private GetOrganizationSettingsHandler $settingsGetHandler,
        private UpdateOrganizationHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $get = $this->getHandler;
        $create = $this->createHandler;
        $settingsGet = $this->settingsGetHandler;
        $update = $this->updateHandler;

        // Superadmin org management (cross-tenant).
        $router->get('/admin/organizations', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/organizations/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->post('/admin/organizations', static fn (ServerRequestInterface $r) => $create->handle($r));

        // Self-scoped org settings (ManageSettings) — always the caller's own organization.
        $router->get('/admin/settings/organization', static fn (ServerRequestInterface $r) => $settingsGet->handle($r));
        $router->patch('/admin/settings/organization', static fn (ServerRequestInterface $r) => $update->handle($r));
    }
}
