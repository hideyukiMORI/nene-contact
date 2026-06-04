<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use LogicException;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class UpdateUserUseCase implements UpdateUserUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private UserRepositoryInterface $users,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, int $id, UpdateUserInput $input): User
    {
        $organizationId = $this->orgId->get();
        $before = $this->users->findById($id);

        // Cross-tenant targets are treated as not found (no existence leak).
        if ($before === null || $before->organizationId !== $organizationId) {
            throw new UserNotFoundException($id);
        }

        $this->users->update(
            $id,
            $input->role ?? $before->role,
            $input->status ?? $before->status,
        );

        $after = $this->users->findById($id);

        if ($after === null) {
            throw new LogicException('User disappeared immediately after update.');
        }

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'user.updated',
            'user',
            $id,
            UserResponse::toArray($before),
            UserResponse::toArray($after),
        );

        return $after;
    }
}
