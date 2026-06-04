<?php

declare(strict_types=1);

namespace NeneContact\Tests\Auth;

use Nene2\Auth\TokenIssuerInterface;
use NeneContact\Auth\InvalidCredentialsException;
use NeneContact\Auth\LoginInput;
use NeneContact\Auth\LoginUseCase;
use NeneContact\Auth\User;
use NeneContact\Auth\UserRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class LoginUseCaseTest extends TestCase
{
    private function tokenIssuer(): TokenIssuerInterface
    {
        return new class () implements TokenIssuerInterface {
            /** @param array<string, mixed> $claims */
            public function issue(array $claims): string
            {
                return 'token:' . ($claims['role'] ?? '') . ':' . ($claims['org_id'] ?? 'null');
            }
        };
    }

    private function repoWith(User $user): UserRepositoryInterface
    {
        return new class ($user) implements UserRepositoryInterface {
            public function __construct(private readonly User $user)
            {
            }

            public function findByEmail(string $email): ?User
            {
                return $email === $this->user->email ? $this->user : null;
            }

            public function findById(int $id): ?User
            {
                return null;
            }

            /** @return list<User> */
            public function listByOrganizationId(int $organizationId): array
            {
                return [];
            }

            public function create(string $email, string $passwordHash, string $role, ?int $organizationId = null): User
            {
                return $this->user;
            }

            public function countByRole(string $role): int
            {
                return 0;
            }

            public function update(int $id, string $role, string $status): void
            {
            }
        };
    }

    public function test_issues_token_for_valid_admin_credentials(): void
    {
        $user = new User(id: 1, email: 'admin@example.com', passwordHash: password_hash('secret', PASSWORD_DEFAULT), role: 'admin', organizationId: 7);
        $useCase = new LoginUseCase($this->repoWith($user), $this->tokenIssuer());

        $output = $useCase->execute(new LoginInput(email: 'admin@example.com', password: 'secret'));

        self::assertSame('admin', $output->role);
        self::assertSame(7, $output->orgId);
        self::assertSame('token:admin:7', $output->token);
    }

    public function test_superadmin_token_has_null_org(): void
    {
        $user = new User(id: 1, email: 'root@example.com', passwordHash: password_hash('secret', PASSWORD_DEFAULT), role: 'superadmin', organizationId: null);
        $useCase = new LoginUseCase($this->repoWith($user), $this->tokenIssuer());

        $output = $useCase->execute(new LoginInput(email: 'root@example.com', password: 'secret'));

        self::assertNull($output->orgId);
    }

    public function test_rejects_wrong_password(): void
    {
        $user = new User(id: 1, email: 'admin@example.com', passwordHash: password_hash('secret', PASSWORD_DEFAULT), role: 'admin', organizationId: 7);
        $useCase = new LoginUseCase($this->repoWith($user), $this->tokenIssuer());

        $this->expectException(InvalidCredentialsException::class);

        $useCase->execute(new LoginInput(email: 'admin@example.com', password: 'wrong'));
    }
}
