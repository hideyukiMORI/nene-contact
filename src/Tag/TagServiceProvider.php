<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use LogicException;
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
 * Wires the tag vocabulary domain (ADR 0019): the org-scoped repository, the list/create/update/
 * delete use cases + handlers, the not-found + label-conflict exception handlers, and the admin
 * route registrar.
 */
final readonly class TagServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                TagRepositoryInterface::class,
                static fn (ContainerInterface $c): TagRepositoryInterface => new PdoTagRepository(self::executor($c), self::orgHolder($c)),
            )
            ->set(
                ListTagsUseCaseInterface::class,
                static fn (ContainerInterface $c): ListTagsUseCaseInterface => new ListTagsUseCase(
                    self::resolve($c, TagRepositoryInterface::class),
                ),
            )
            ->set(
                CreateTagUseCaseInterface::class,
                static fn (ContainerInterface $c): CreateTagUseCaseInterface => new CreateTagUseCase(
                    self::resolve($c, TagRepositoryInterface::class),
                    self::resolve($c, AuditRecorderInterface::class),
                    self::resolve($c, ClockInterface::class),
                    self::orgHolder($c),
                ),
            )
            ->set(
                UpdateTagUseCaseInterface::class,
                static fn (ContainerInterface $c): UpdateTagUseCaseInterface => new UpdateTagUseCase(
                    self::resolve($c, TagRepositoryInterface::class),
                    self::resolve($c, AuditRecorderInterface::class),
                    self::resolve($c, ClockInterface::class),
                    self::orgHolder($c),
                ),
            )
            ->set(
                DeleteTagUseCaseInterface::class,
                static fn (ContainerInterface $c): DeleteTagUseCaseInterface => new DeleteTagUseCase(
                    self::resolve($c, TagRepositoryInterface::class),
                    self::resolve($c, AuditRecorderInterface::class),
                    self::resolve($c, ClockInterface::class),
                    self::orgHolder($c),
                ),
            )
            ->set(
                ListTagsHandler::class,
                static fn (ContainerInterface $c): ListTagsHandler => new ListTagsHandler(
                    self::resolve($c, ListTagsUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                CreateTagHandler::class,
                static fn (ContainerInterface $c): CreateTagHandler => new CreateTagHandler(
                    self::resolve($c, CreateTagUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                UpdateTagHandler::class,
                static fn (ContainerInterface $c): UpdateTagHandler => new UpdateTagHandler(
                    self::resolve($c, UpdateTagUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                DeleteTagHandler::class,
                static fn (ContainerInterface $c): DeleteTagHandler => new DeleteTagHandler(
                    self::resolve($c, DeleteTagUseCaseInterface::class),
                    self::json($c),
                ),
            )
            ->set(
                TagNotFoundExceptionHandler::class,
                static fn (ContainerInterface $c): TagNotFoundExceptionHandler => new TagNotFoundExceptionHandler(self::problemDetails($c)),
            )
            ->set(
                TagLabelConflictExceptionHandler::class,
                static fn (ContainerInterface $c): TagLabelConflictExceptionHandler => new TagLabelConflictExceptionHandler(self::problemDetails($c)),
            )
            ->set(
                TagRouteRegistrar::class,
                static fn (ContainerInterface $c): TagRouteRegistrar => new TagRouteRegistrar(
                    self::resolve($c, ListTagsHandler::class),
                    self::resolve($c, CreateTagHandler::class),
                    self::resolve($c, UpdateTagHandler::class),
                    self::resolve($c, DeleteTagHandler::class),
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
