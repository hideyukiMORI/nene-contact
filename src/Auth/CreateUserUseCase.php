<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class CreateUserUseCase implements CreateUserUseCaseInterface
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

    public function execute(?int $actorUserId, CreateUserInput $input): User
    {
        if ($this->users->findByEmail($input->email) !== null) {
            throw new EmailConflictException($input->email);
        }

        $organizationId = $this->orgId->get();

        $user = $this->users->create(
            email: $input->email,
            passwordHash: password_hash($input->password, PASSWORD_DEFAULT),
            role: $input->role,
            organizationId: $organizationId,
        );

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'user.created',
            'user',
            $user->id,
            null,
            UserResponse::toArray($user),
        );

        return $user;
    }
}
