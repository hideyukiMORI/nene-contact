<?php

declare(strict_types=1);

namespace NeneContact\Audit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
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
                AuditRecorderInterface::class,
                static function (ContainerInterface $c): AuditRecorderInterface {
                    $repo = $c->get(AuditEventRepositoryInterface::class);

                    if (!$repo instanceof AuditEventRepositoryInterface) {
                        throw new LogicException('Audit event repository service is invalid.');
                    }

                    return new AuditRecorder($repo);
                },
            );
    }
}
