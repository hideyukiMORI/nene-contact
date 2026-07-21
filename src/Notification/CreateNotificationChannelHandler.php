<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateNotificationChannelHandler implements RequestHandlerInterface
{
    public function __construct(
        private CreateNotificationChannelUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $errors = [];

        $contactFormId = (int) ($body['contact_form_id'] ?? 0);
        if ($contactFormId <= 0) {
            $errors[] = new ValidationError('contact_form_id', 'contact_form_id is required.', 'required');
        }

        $channelType = (string) ($body['channel_type'] ?? '');
        $isKnownType = in_array($channelType, ChannelConfigValidator::CHANNEL_TYPES, true);
        if (!$isKnownType) {
            $errors[] = new ValidationError('channel_type', 'Channel type must be one of: ' . implode(', ', ChannelConfigValidator::CHANNEL_TYPES) . '.', 'invalid');
        }

        /** @var array<string, mixed> $config */
        $config = is_array($body['config'] ?? null) ? $body['config'] : [];

        // Normalize + validate the config for every known type (email/slack/chatwork/webhook)
        // so no type — chatwork and slack included — can be stored unvalidated.
        if ($isKnownType) {
            $config = ChannelConfigValidator::normalize($channelType, $config);
            $errors = array_merge($errors, ChannelConfigValidator::validate($channelType, $config));
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $channel = $this->useCase->execute($actorUserId, new CreateNotificationChannelInput(
            contactFormId: $contactFormId,
            channelType: $channelType,
            config: $config,
            isEnabled: (bool) ($body['is_enabled'] ?? true),
        ));

        return $this->response->create(NotificationChannelResponse::toArray($channel), 201);
    }
}
