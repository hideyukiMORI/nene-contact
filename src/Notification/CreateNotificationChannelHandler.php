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
    /** @var list<string> */
    private const CHANNEL_TYPES = ['email', 'slack', 'chatwork'];

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
        if (!in_array($channelType, self::CHANNEL_TYPES, true)) {
            $errors[] = new ValidationError('channel_type', 'Channel type must be one of: ' . implode(', ', self::CHANNEL_TYPES) . '.', 'invalid');
        }

        /** @var array<string, mixed> $config */
        $config = is_array($body['config'] ?? null) ? $body['config'] : [];

        if ($channelType === 'email') {
            $recipient = isset($config['recipient']) ? trim((string) $config['recipient']) : '';
            if ($recipient === '' || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
                $errors[] = new ValidationError('config.recipient', 'A valid recipient email is required for email channels.', 'invalid_email');
            }
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
