<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListNotificationChannelsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListNotificationChannelsUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();
        $contactFormId = (int) ($params['contact_form_id'] ?? 0);

        if ($contactFormId <= 0) {
            throw new ValidationException([new ValidationError('contact_form_id', 'contact_form_id query parameter is required.', 'required')]);
        }

        return $this->response->create([
            'items' => array_map(
                static fn (NotificationChannel $c): array => NotificationChannelResponse::toArray($c),
                $this->useCase->execute($contactFormId),
            ),
        ]);
    }
}
