<?php

declare(strict_types=1);

namespace NeneContact\Records;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Admin Records routes. Under `/admin/records`, so the {@see \NeneContact\Auth\CapabilityResolver}
 * gates them as ManageForms (this feeds the form builder).
 */
final readonly class RecordsRouteRegistrar
{
    public function __construct(
        private RecordsOptionsHandler $optionsHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $options = $this->optionsHandler;

        $router->get('/admin/records/options', static fn (ServerRequestInterface $r) => $options->handle($r));
    }
}
