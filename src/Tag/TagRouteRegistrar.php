<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Registers tag vocabulary routes (`/admin/tags`, ADR 0019). All require ManageSettings via
 * CapabilityMiddleware, scoped to the resolved organization (ADR 0014).
 */
final readonly class TagRouteRegistrar
{
    public function __construct(
        private ListTagsHandler $listHandler,
        private CreateTagHandler $createHandler,
        private UpdateTagHandler $updateHandler,
        private DeleteTagHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;
        $delete = $this->deleteHandler;

        $router->get('/admin/tags', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/admin/tags', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->patch('/admin/tags/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
        $router->delete('/admin/tags/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
    }
}
