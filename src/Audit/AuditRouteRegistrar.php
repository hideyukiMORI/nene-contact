<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AuditRouteRegistrar
{
    public function __construct(
        private ListAuditEventsHandler $listHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;

        // Admin audit trail (read). Capability ViewAuditLog gates access to admin/superadmin.
        $router->get('/admin/audit-events', static fn (ServerRequestInterface $r) => $list->handle($r));
    }
}
