<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class UserAdminRouteRegistrar
{
    public function __construct(
        private ListUsersHandler $listHandler,
        private GetUserByIdHandler $getHandler,
        private CreateUserHandler $createHandler,
        private UpdateUserHandler $updateHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $get = $this->getHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;

        $router->get('/admin/users', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/users/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->post('/admin/users', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->patch('/admin/users/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
    }
}
