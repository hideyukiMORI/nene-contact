<?php

declare(strict_types=1);

namespace NeneContact;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Auth\AuthRouteRegistrar;
use NeneContact\Auth\AuthServiceProvider;
use NeneContact\Auth\InvalidCredentialsExceptionHandler;
use NeneContact\Organization\OrganizationNotFoundExceptionHandler;
use NeneContact\Organization\OrganizationRouteRegistrar;
use NeneContact\Organization\OrganizationServiceProvider;
use NeneContact\Organization\OrganizationSlugConflictExceptionHandler;
use Psr\Container\ContainerInterface;

/**
 * Aggregates application route registrars, domain exception handlers, and the shared
 * request-scoped organization holder. Domain service providers append their registrars
 * and handlers here as they land (Phase 1+).
 */
final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const ROUTE_REGISTRARS = 'nene-contact.route_registrars';

    public const EXCEPTION_HANDLERS = 'nene-contact.exception_handlers';

    /** Container key for the shared RequestScopedHolder<int> that carries organization_id. */
    public const ORG_ID_HOLDER = 'nene-contact.org_id_holder';

    public function register(ContainerBuilder $builder): void
    {
        $builder->set(
            self::ORG_ID_HOLDER,
            static function (): RequestScopedHolder {
                /** @var RequestScopedHolder<int> */
                return new RequestScopedHolder();
            },
        );

        $builder->addProvider(new AuthServiceProvider());
        $builder->addProvider(new OrganizationServiceProvider());

        $builder
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $auth = $container->get(AuthRouteRegistrar::class);
                    $organization = $container->get(OrganizationRouteRegistrar::class);

                    if (!$auth instanceof AuthRouteRegistrar) {
                        throw new LogicException('Auth route registrar service is invalid.');
                    }

                    if (!$organization instanceof OrganizationRouteRegistrar) {
                        throw new LogicException('Organization route registrar service is invalid.');
                    }

                    return [
                        $auth,
                        $organization,
                    ];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidCredentialsExceptionHandler::class);
                    $organizationNotFound = $container->get(OrganizationNotFoundExceptionHandler::class);
                    $organizationSlugConflict = $container->get(OrganizationSlugConflictExceptionHandler::class);

                    foreach ([$invalidCredentials, $organizationNotFound, $organizationSlugConflict] as $handler) {
                        if (!$handler instanceof DomainExceptionHandlerInterface) {
                            throw new LogicException('Exception handler service is invalid.');
                        }
                    }

                    return [
                        $invalidCredentials,
                        $organizationNotFound,
                        $organizationSlugConflict,
                    ];
                },
            );
    }
}
