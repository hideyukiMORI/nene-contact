<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use Psr\Container\ContainerInterface;

final readonly class AuditServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AuditEventRepositoryInterface::class,
                static function (ContainerInterface $c): AuditEventRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoAuditEventRepository($query, $orgId);
                },
            )
            ->set(
                AuditEventSearchRepositoryInterface::class,
                static function (ContainerInterface $c): AuditEventSearchRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoAuditEventRepository($query, $orgId);
                },
            )
            ->set(
                AuditRecorderInterface::class,
                static function (ContainerInterface $c): AuditRecorderInterface {
                    $repo = $c->get(AuditEventRepositoryInterface::class);

                    if (!$repo instanceof AuditEventRepositoryInterface) {
                        throw new LogicException('Audit event repository service is invalid.');
                    }

                    return new AuditRecorder($repo);
                },
            )
            ->set(
                ListAuditEventsUseCaseInterface::class,
                static function (ContainerInterface $c): ListAuditEventsUseCaseInterface {
                    $repo = $c->get(AuditEventSearchRepositoryInterface::class);

                    if (!$repo instanceof AuditEventSearchRepositoryInterface) {
                        throw new LogicException('Audit event search repository service is invalid.');
                    }

                    return new ListAuditEventsUseCase($repo);
                },
            )
            ->set(
                ListAuditEventsHandler::class,
                static function (ContainerInterface $c): ListAuditEventsHandler {
                    $useCase = $c->get(ListAuditEventsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ListAuditEventsUseCaseInterface) {
                        throw new LogicException('List audit events use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListAuditEventsHandler($useCase, $json);
                },
            )
            ->set(
                AuditRouteRegistrar::class,
                static function (ContainerInterface $c): AuditRouteRegistrar {
                    $list = $c->get(ListAuditEventsHandler::class);

                    if (!$list instanceof ListAuditEventsHandler) {
                        throw new LogicException('List audit events handler service is invalid.');
                    }

                    return new AuditRouteRegistrar($list);
                },
            );
    }
}
