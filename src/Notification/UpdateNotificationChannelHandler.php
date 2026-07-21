<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * PATCH /admin/notification-channels/{id} — edit a channel's config and/or enabled flag.
 */
final readonly class UpdateNotificationChannelHandler implements RequestHandlerInterface
{
    public function __construct(
        private UpdateNotificationChannelUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);

        $isEnabled = array_key_exists('is_enabled', $body) ? (bool) $body['is_enabled'] : null;
        $config = is_array($body['config'] ?? null) ? $body['config'] : null;

        if ($isEnabled === null && $config === null) {
            throw new ValidationException([new ValidationError('body', 'Provide is_enabled and/or config to update.', 'required')]);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $channel = $this->useCase->execute($actorUserId, $id, new UpdateNotificationChannelInput($isEnabled, $config));

        return $this->response->create(NotificationChannelResponse::toArray($channel));
    }
}
