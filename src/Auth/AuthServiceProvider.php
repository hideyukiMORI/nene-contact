<?php

declare(strict_types=1);

namespace NeneContact\Auth;

use LogicException;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use Psr\Container\ContainerInterface;

final readonly class AuthServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                UserRepositoryInterface::class,
                static function (ContainerInterface $c): UserRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoUserRepository($query);
                },
            )
            ->set(
                LoginUseCase::class,
                static function (ContainerInterface $c): LoginUseCase {
                    $users = $c->get(UserRepositoryInterface::class);
                    $tokenIssuer = $c->get(TokenIssuerInterface::class);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }

                    if (!$tokenIssuer instanceof TokenIssuerInterface) {
                        throw new LogicException('Token issuer service is invalid.');
                    }

                    return new LoginUseCase($users, $tokenIssuer);
                },
            )
            ->set(
                LoginHandler::class,
                static function (ContainerInterface $c): LoginHandler {
                    $useCase = $c->get(LoginUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$useCase instanceof LoginUseCase) {
                        throw new LogicException('Login use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new LoginHandler($useCase, $json);
                },
            )
            ->set(
                InvalidCredentialsExceptionHandler::class,
                static function (ContainerInterface $c): InvalidCredentialsExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new InvalidCredentialsExceptionHandler($problemDetails);
                },
            )
            ->set(
                AuthRouteRegistrar::class,
                static function (ContainerInterface $c): AuthRouteRegistrar {
                    $login = $c->get(LoginHandler::class);

                    if (!$login instanceof LoginHandler) {
                        throw new LogicException('Login handler service is invalid.');
                    }

                    return new AuthRouteRegistrar($login);
                },
            )
            ->set(
                CreateUserUseCaseInterface::class,
                static function (ContainerInterface $c): CreateUserUseCaseInterface {
                    $users = $c->get(UserRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new CreateUserUseCase($users, $audit, $orgId);
                },
            )
            ->set(
                ListUsersUseCaseInterface::class,
                static function (ContainerInterface $c): ListUsersUseCaseInterface {
                    $users = $c->get(UserRepositoryInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new ListUsersUseCase($users, $orgId);
                },
            )
            ->set(
                GetUserByIdUseCaseInterface::class,
                static function (ContainerInterface $c): GetUserByIdUseCaseInterface {
                    $users = $c->get(UserRepositoryInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new GetUserByIdUseCase($users, $orgId);
                },
            )
            ->set(
                UpdateUserUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateUserUseCaseInterface {
                    $users = $c->get(UserRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new UpdateUserUseCase($users, $audit, $orgId);
                },
            )
            ->set(
                CreateUserHandler::class,
                static function (ContainerInterface $c): CreateUserHandler {
                    $uc = $c->get(CreateUserUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CreateUserUseCaseInterface) {
                        throw new LogicException('CreateUser use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateUserHandler($uc, $json);
                },
            )
            ->set(
                ListUsersHandler::class,
                static function (ContainerInterface $c): ListUsersHandler {
                    $uc = $c->get(ListUsersUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListUsersUseCaseInterface) {
                        throw new LogicException('ListUsers use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListUsersHandler($uc, $json);
                },
            )
            ->set(
                GetUserByIdHandler::class,
                static function (ContainerInterface $c): GetUserByIdHandler {
                    $uc = $c->get(GetUserByIdUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetUserByIdUseCaseInterface) {
                        throw new LogicException('GetUserById use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetUserByIdHandler($uc, $json);
                },
            )
            ->set(
                UpdateUserHandler::class,
                static function (ContainerInterface $c): UpdateUserHandler {
                    $uc = $c->get(UpdateUserUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateUserUseCaseInterface) {
                        throw new LogicException('UpdateUser use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateUserHandler($uc, $json);
                },
            )
            ->set(
                UserNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): UserNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new UserNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                EmailConflictExceptionHandler::class,
                static function (ContainerInterface $c): EmailConflictExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new EmailConflictExceptionHandler($problemDetails);
                },
            )
            ->set(
                UserAdminRouteRegistrar::class,
                static function (ContainerInterface $c): UserAdminRouteRegistrar {
                    $list = $c->get(ListUsersHandler::class);
                    $get = $c->get(GetUserByIdHandler::class);
                    $create = $c->get(CreateUserHandler::class);
                    $update = $c->get(UpdateUserHandler::class);

                    if (!$list instanceof ListUsersHandler) {
                        throw new LogicException('ListUsers handler service is invalid.');
                    }

                    if (!$get instanceof GetUserByIdHandler) {
                        throw new LogicException('GetUserById handler service is invalid.');
                    }

                    if (!$create instanceof CreateUserHandler) {
                        throw new LogicException('CreateUser handler service is invalid.');
                    }

                    if (!$update instanceof UpdateUserHandler) {
                        throw new LogicException('UpdateUser handler service is invalid.');
                    }

                    return new UserAdminRouteRegistrar($list, $get, $create, $update);
                },
            );
    }
}
