<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /admin/notification-channels/{id}/test — send a sample notification and report whether
 * it reached the channel. A dispatch failure returns 200 with {ok:false,error} (not a 5xx):
 * the test ran; the channel is what failed.
 */
final readonly class TestNotificationChannelHandler implements RequestHandlerInterface
{
    public function __construct(
        private TestNotificationChannelUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $result = $this->useCase->execute($actorUserId, $id);

        return $this->response->create($result->toArray());
    }
}
