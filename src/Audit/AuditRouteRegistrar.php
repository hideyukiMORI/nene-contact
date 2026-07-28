<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AuditRouteRegistrar
{
    public function __construct(
        private ListAuditEventsHandler $listHandler,
        private ExportAuditEventsHandler $exportHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $export = $this->exportHandler;

        // Admin audit trail (read). Capability ViewAuditLog gates access to admin/superadmin.
        $router->get('/admin/audit-events', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/audit-events/export', static fn (ServerRequestInterface $r) => $export->handle($r));
    }
}
