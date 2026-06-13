<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AuthRouteRegistrar
{
    public function __construct(
        private LoginHandler $loginHandler,
        private ChangePasswordHandler $changePasswordHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $login = $this->loginHandler;
        $changePassword = $this->changePasswordHandler;

        $router->post('/admin/auth/login', static fn (ServerRequestInterface $r) => $login->handle($r));

        // Self-service password change for the authenticated actor. Lives under /admin/account
        // (not /admin/auth, which is always-open) so the Bearer token is required and the actor
        // is resolved from the token — never a path id.
        $router->post('/admin/account/password', static fn (ServerRequestInterface $r) => $changePassword->handle($r));
    }
}
