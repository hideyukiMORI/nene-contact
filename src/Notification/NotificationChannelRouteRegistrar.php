<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class NotificationChannelRouteRegistrar
{
    public function __construct(
        private ListNotificationChannelsHandler $listHandler,
        private GetNotificationChannelHandler $getHandler,
        private CreateNotificationChannelHandler $createHandler,
        private UpdateNotificationChannelHandler $updateHandler,
        private DeleteNotificationChannelHandler $deleteHandler,
        private TestNotificationChannelHandler $testHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list = $this->listHandler;
        $get = $this->getHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;
        $delete = $this->deleteHandler;
        $test = $this->testHandler;

        $router->get('/admin/notification-channels', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/notification-channels/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->post('/admin/notification-channels', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->patch('/admin/notification-channels/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
        $router->delete('/admin/notification-channels/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
        $router->post('/admin/notification-channels/{id}/test', static fn (ServerRequestInterface $r) => $test->handle($r));
    }
}
