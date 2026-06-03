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
            );
    }
}
