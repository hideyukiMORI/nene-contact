<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\RequestScopedHolder;

final readonly class ListUsersUseCase implements ListUsersUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private UserRepositoryInterface $users,
        private RequestScopedHolder $orgId,
    ) {
    }

    /** @return list<User> */
    public function execute(): array
    {
        return $this->users->listByOrganizationId($this->orgId->get());
    }
}
