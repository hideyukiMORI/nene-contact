<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\RequestScopedHolder;

final readonly class GetUserByIdUseCase implements GetUserByIdUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private UserRepositoryInterface $users,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(int $id): User
    {
        $user = $this->users->findById($id);

        // Cross-tenant targets are treated as not found (no existence leak).
        if ($user === null || $user->organizationId !== $this->orgId->get()) {
            throw new UserNotFoundException($id);
        }

        return $user;
    }
}
