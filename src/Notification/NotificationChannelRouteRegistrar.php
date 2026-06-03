<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class NotificationChannelRouteRegistrar
{
    public function __construct(
        private ListNotificationChannelsHandler $listHandler,
        private CreateNotificationChannelHandler $createHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $create = $this->createHandler;

        $router->get('/admin/notification-channels', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/admin/notification-channels', static fn (ServerRequestInterface $r) => $create->handle($r));
    }
}
