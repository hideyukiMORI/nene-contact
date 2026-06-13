<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use LogicException;
use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ChangePasswordHandler implements RequestHandlerInterface
{
    private const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        private ChangePasswordUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $errors = [];

        $current = isset($body['current_password']) && is_string($body['current_password'])
            ? $body['current_password']
            : '';
        $new = isset($body['new_password']) && is_string($body['new_password'])
            ? $body['new_password']
            : '';

        if ($current === '') {
            $errors[] = new ValidationError('current_password', 'The current password is required.', 'required');
        }

        if (strlen($new) < self::MIN_PASSWORD_LENGTH) {
            $errors[] = new ValidationError('new_password', 'New password must be at least ' . self::MIN_PASSWORD_LENGTH . ' characters.', 'invalid');
        } elseif ($new === $current) {
            $errors[] = new ValidationError('new_password', 'The new password must differ from the current one.', 'invalid');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        // AdminApiAuthMiddleware guarantees a verified token for /admin/* (except /admin/auth/*),
        // so the actor is always present here.
        if ($actorUserId === null) {
            throw new LogicException('Authenticated actor is missing from the request claims.');
        }

        $this->useCase->execute($actorUserId, new ChangePasswordInput(
            currentPassword: $current,
            newPassword: $new,
        ));

        return $this->response->createEmpty(204);
    }
}
