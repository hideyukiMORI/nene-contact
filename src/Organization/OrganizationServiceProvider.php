<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneContact\Audit\AuditRecorderInterface;
use Psr\Container\ContainerInterface;

final readonly class OrganizationServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                OrganizationRepositoryInterface::class,
                static function (ContainerInterface $c): OrganizationRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoOrganizationRepository($query);
                },
            )
            ->set(
                ListOrganizationsUseCaseInterface::class,
                static function (ContainerInterface $c): ListOrganizationsUseCaseInterface {
                    $repo = $c->get(OrganizationRepositoryInterface::class);

                    if (!$repo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    return new ListOrganizationsUseCase($repo);
                },
            )
            ->set(
                GetOrganizationByIdUseCaseInterface::class,
                static function (ContainerInterface $c): GetOrganizationByIdUseCaseInterface {
                    $repo = $c->get(OrganizationRepositoryInterface::class);

                    if (!$repo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    return new GetOrganizationByIdUseCase($repo);
                },
            )
            ->set(
                CreateOrganizationUseCaseInterface::class,
                static function (ContainerInterface $c): CreateOrganizationUseCaseInterface {
                    $repo = $c->get(OrganizationRepositoryInterface::class);

                    if (!$repo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new CreateOrganizationUseCase($repo, $audit);
                },
            )
            ->set(
                UpdateOrganizationUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateOrganizationUseCaseInterface {
                    $repo = $c->get(OrganizationRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new UpdateOrganizationUseCase($repo, $audit);
                },
            )
            ->set(
                ListOrganizationsHandler::class,
                static function (ContainerInterface $c): ListOrganizationsHandler {
                    $uc = $c->get(ListOrganizationsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListOrganizationsUseCaseInterface) {
                        throw new LogicException('ListOrganizations use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListOrganizationsHandler($uc, $json);
                },
            )
            ->set(
                GetOrganizationByIdHandler::class,
                static function (ContainerInterface $c): GetOrganizationByIdHandler {
                    $uc = $c->get(GetOrganizationByIdUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetOrganizationByIdUseCaseInterface) {
                        throw new LogicException('GetOrganizationById use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetOrganizationByIdHandler($uc, $json);
                },
            )
            ->set(
                CreateOrganizationHandler::class,
                static function (ContainerInterface $c): CreateOrganizationHandler {
                    $uc = $c->get(CreateOrganizationUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CreateOrganizationUseCaseInterface) {
                        throw new LogicException('CreateOrganization use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateOrganizationHandler($uc, $json);
                },
            )
            ->set(
                UpdateOrganizationHandler::class,
                static function (ContainerInterface $c): UpdateOrganizationHandler {
                    $uc = $c->get(UpdateOrganizationUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateOrganizationUseCaseInterface) {
                        throw new LogicException('UpdateOrganization use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateOrganizationHandler($uc, $json);
                },
            )
            ->set(
                GetOrganizationSettingsHandler::class,
                static function (ContainerInterface $c): GetOrganizationSettingsHandler {
                    $uc = $c->get(GetOrganizationByIdUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetOrganizationByIdUseCaseInterface) {
                        throw new LogicException('GetOrganizationById use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetOrganizationSettingsHandler($uc, $json);
                },
            )
            ->set(
                OrganizationNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): OrganizationNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new OrganizationNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                OrganizationSlugConflictExceptionHandler::class,
                static function (ContainerInterface $c): OrganizationSlugConflictExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new OrganizationSlugConflictExceptionHandler($problemDetails);
                },
            )
            ->set(
                OrganizationRouteRegistrar::class,
                static function (ContainerInterface $c): OrganizationRouteRegistrar {
                    $list = $c->get(ListOrganizationsHandler::class);
                    $get = $c->get(GetOrganizationByIdHandler::class);
                    $create = $c->get(CreateOrganizationHandler::class);
                    $settingsGet = $c->get(GetOrganizationSettingsHandler::class);
                    $update = $c->get(UpdateOrganizationHandler::class);

                    if (!$list instanceof ListOrganizationsHandler) {
                        throw new LogicException('ListOrganizations handler service is invalid.');
                    }

                    if (!$get instanceof GetOrganizationByIdHandler) {
                        throw new LogicException('GetOrganizationById handler service is invalid.');
                    }

                    if (!$create instanceof CreateOrganizationHandler) {
                        throw new LogicException('CreateOrganization handler service is invalid.');
                    }

                    if (!$settingsGet instanceof GetOrganizationSettingsHandler) {
                        throw new LogicException('GetOrganizationSettings handler service is invalid.');
                    }

                    if (!$update instanceof UpdateOrganizationHandler) {
                        throw new LogicException('UpdateOrganization handler service is invalid.');
                    }

                    return new OrganizationRouteRegistrar($list, $get, $create, $settingsGet, $update);
                },
            );
    }
}
