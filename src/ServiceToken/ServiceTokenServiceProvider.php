<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use Psr\Container\ContainerInterface;

/**
 * Wires the service-token registry domain (embed 案1 / records native embed, #386). PR ①
 * registers only the persistence primitive — the org-scoped registry repository and the
 * request-time revocation authorizer. Issue/list/revoke use cases, handlers, the auth
 * dispatcher, and routes land in the backend PR.
 */
final readonly class ServiceTokenServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ServiceTokenRepositoryInterface::class,
                static function (ContainerInterface $c): ServiceTokenRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }
                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    return new PdoServiceTokenRepository($query, $orgId);
                },
            )
            ->set(
                ServiceTokenAuthorizerInterface::class,
                static function (ContainerInterface $c): ServiceTokenAuthorizerInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoServiceTokenAuthorizer($query);
                },
            );
    }
}
