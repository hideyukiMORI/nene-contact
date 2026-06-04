<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListUsersHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListUsersUseCaseInterface $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $users = $this->useCase->execute();

        return $this->response->create([
            'items' => array_map(static fn (User $u): array => UserResponse::toArray($u), $users),
        ]);
    }
}
