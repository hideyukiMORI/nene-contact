<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class MediaRouteRegistrar
{
    public function __construct(
        private UploadMediaHandler $uploadHandler,
        private ListMediaHandler $listHandler,
        private DeleteMediaHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $upload = $this->uploadHandler;
        $list = $this->listHandler;
        $delete = $this->deleteHandler;

        // Admin, org-scoped (ManageForms capability). The bytes are served statically from
        // /media/* by the web server, not through these routes.
        $router->get('/admin/media', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/admin/media', static fn (ServerRequestInterface $r) => $upload->handle($r));
        $router->delete('/admin/media/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
    }
}
