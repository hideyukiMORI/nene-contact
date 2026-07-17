<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use LogicException;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use Psr\Container\ContainerInterface;

/**
 * Wires the service-token domain (embed 案1 / records native embed, #386/#388): the org-scoped
 * registry repository, the request-time revocation authorizer, the issue/list/revoke use cases
 * + handlers, the not-found exception handler, and the admin route registrar.
 */
final readonly class ServiceTokenServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ServiceTokenRepositoryInterface::class,
                static fn (ContainerInterface $c): ServiceTokenRepositoryInterface => new PdoServiceTokenRepository(self::executor($c), self::orgHolder($c)),
            )
            ->set(
                ServiceTokenAuthorizerInterface::class,
                static fn (ContainerInterface $c): ServiceTokenAuthorizerInterface => new PdoServiceTokenAuthorizer(self::executor($c)),
            )
            ->set(
                IssueServiceTokenUseCaseInterface::class,
                static fn (ContainerInterface $c): IssueServiceTokenUseCaseInterface => new IssueServiceTokenUseCase(
                    self::resolve($c, TokenIssuerInterface::class),
                    self::resolve($c, ServiceTokenRepositoryInterface::class),
                    self::resolve($c, AuditRecorderInterface::class),
                    self::resolve($c, ClockInterface::class),
                    self::orgHolder($c),
                ),
            )
            ->set(
                ListServiceTokensUseCaseInterface::class,
                static fn (ContainerInterface $c): ListServiceTokensUseCaseInterface => new ListServiceTokensUseCase(
                    self::resolve($c, ServiceTokenRepositoryInterface::class),
                ),
            )
            ->set(
                RevokeServiceTokenUseCaseInterface::class,
                static fn (ContainerInterface $c): RevokeServiceTokenUseCaseInterface => new RevokeServiceTokenUseCase(
                    self::resolve($c, ServiceTokenRepositoryInterface::class),
                    self::resolve($c, AuditRecorderInterface::class),
                    self::resolve($c, ClockInterface::class),
                    self::orgHolder($c),
                ),
            )
            ->set(
                IssueServiceTokenHandler::class,
                static fn (ContainerInterface $c): IssueServiceTokenHandler => new IssueServiceTokenHandler(
                    self::resolve($c, IssueServiceTokenUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                ListServiceTokensHandler::class,
                static fn (ContainerInterface $c): ListServiceTokensHandler => new ListServiceTokensHandler(
                    self::resolve($c, ListServiceTokensUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                RevokeServiceTokenHandler::class,
                static fn (ContainerInterface $c): RevokeServiceTokenHandler => new RevokeServiceTokenHandler(
                    self::resolve($c, RevokeServiceTokenUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                ServiceTokenNotFoundExceptionHandler::class,
                static fn (ContainerInterface $c): ServiceTokenNotFoundExceptionHandler => new ServiceTokenNotFoundExceptionHandler(self::problemDetails($c)),
            )
            ->set(
                ServiceTokenRouteRegistrar::class,
                static fn (ContainerInterface $c): ServiceTokenRouteRegistrar => new ServiceTokenRouteRegistrar(
                    self::resolve($c, ListServiceTokensHandler::class),
                    self::resolve($c, IssueServiceTokenHandler::class),
                    self::resolve($c, RevokeServiceTokenHandler::class),
                ),
            );
    }

    private static function executor(ContainerInterface $c): DatabaseQueryExecutorInterface
    {
        return self::resolve($c, DatabaseQueryExecutorInterface::class);
    }

    /** @return RequestScopedHolder<int> */
    private static function orgHolder(ContainerInterface $c): RequestScopedHolder
    {
        $holder = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

        if (!$holder instanceof RequestScopedHolder) {
            throw new LogicException('Org id holder service is invalid.');
        }

        return $holder;
    }

    private static function json(ContainerInterface $c): JsonResponseFactory
    {
        return self::resolve($c, JsonResponseFactory::class);
    }

    private static function problemDetails(ContainerInterface $c): ProblemDetailsResponseFactory
    {
        return self::resolve($c, ProblemDetailsResponseFactory::class);
    }

    /**
     * @template T of object
     * @param class-string<T> $id
     * @return T
     */
    private static function resolve(ContainerInterface $c, string $id): object
    {
        $service = $c->get($id);

        if (!$service instanceof $id) {
            throw new LogicException(sprintf('Service %s is invalid.', $id));
        }

        return $service;
    }
}
