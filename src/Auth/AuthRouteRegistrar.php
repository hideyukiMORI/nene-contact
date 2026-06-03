<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AuthRouteRegistrar
{
    public function __construct(
        private LoginHandler $loginHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $login = $this->loginHandler;

        $router->post('/admin/auth/login', static fn (ServerRequestInterface $r) => $login->handle($r));
    }
}
