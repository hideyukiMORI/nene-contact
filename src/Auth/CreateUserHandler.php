<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateUserHandler implements RequestHandlerInterface
{
    /** Roles assignable via the admin API. superadmin is cross-tenant and stays CLI-only. */
    public const ASSIGNABLE_ROLES = ['admin', 'editor'];

    private const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        private CreateUserUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = JsonRequestBodyParser::parse($request);
        $errors = [];

        $email = trim((string) ($body['email'] ?? ''));
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors[] = new ValidationError('email', 'A valid email is required.', 'invalid');
        }

        $password = (string) ($body['password'] ?? '');
        if (strlen($password) < self::MIN_PASSWORD_LENGTH) {
            $errors[] = new ValidationError('password', 'Password must be at least ' . self::MIN_PASSWORD_LENGTH . ' characters.', 'invalid');
        }

        $role = (string) ($body['role'] ?? '');
        if (!in_array($role, self::ASSIGNABLE_ROLES, true)) {
            $errors[] = new ValidationError('role', 'Role must be one of: ' . implode(', ', self::ASSIGNABLE_ROLES) . '.', 'invalid');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $user = $this->useCase->execute($actorUserId, new CreateUserInput(
            email: $email,
            password: $password,
            role: $role,
        ));

        return $this->response->create(
            UserResponse::toArray($user),
            201,
            ['Location' => '/admin/users/' . $user->id],
        );
    }
}
