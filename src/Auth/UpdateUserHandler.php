<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UpdateUserHandler implements RequestHandlerInterface
{
    /** @var list<string> */
    private const STATUSES = ['active', 'disabled'];

    public function __construct(
        private UpdateUserUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id = (int) ($parameters['id'] ?? 0);

        $body = JsonRequestBodyParser::parse($request);
        $errors = [];

        $role = array_key_exists('role', $body) ? (string) $body['role'] : null;
        $status = array_key_exists('status', $body) ? (string) $body['status'] : null;

        if ($role === null && $status === null) {
            $errors[] = new ValidationError('role', 'Provide at least one of role or status.', 'required');
        }

        if ($role !== null && !in_array($role, CreateUserHandler::ASSIGNABLE_ROLES, true)) {
            $errors[] = new ValidationError('role', 'Role must be one of: ' . implode(', ', CreateUserHandler::ASSIGNABLE_ROLES) . '.', 'invalid');
        }

        if ($status !== null && !in_array($status, self::STATUSES, true)) {
            $errors[] = new ValidationError('status', 'Status must be one of: ' . implode(', ', self::STATUSES) . '.', 'invalid');
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        // Anti-lockout: an actor cannot change their own role or status.
        if ($actorUserId !== null && $actorUserId === $id) {
            $errors[] = new ValidationError('id', 'You cannot change your own role or status.', 'forbidden');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $user = $this->useCase->execute($actorUserId, $id, new UpdateUserInput(role: $role, status: $status));

        return $this->response->create(UserResponse::toArray($user));
    }
}
