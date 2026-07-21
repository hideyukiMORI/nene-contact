<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/notification-channels/{id} — channel detail. The config (secrets) is never
 * returned; only type, form, and enabled flag are exposed (charter §6/§10).
 */
final readonly class GetNotificationChannelHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetNotificationChannelUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $channel = $this->useCase->execute($id);

        return $this->response->create(NotificationChannelResponse::toArray($channel));
    }
}
