<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use Psr\Container\ContainerInterface;

final readonly class ContactFormServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ContactFormRepositoryInterface::class,
                static function (ContainerInterface $c): ContactFormRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $tx = $c->get(DatabaseTransactionManagerInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$tx instanceof DatabaseTransactionManagerInterface) {
                        throw new LogicException('Database transaction manager service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoContactFormRepository($query, $tx, $orgId);
                },
            )
            ->set(
                CreateContactFormUseCaseInterface::class,
                static function (ContainerInterface $c): CreateContactFormUseCaseInterface {
                    $repo = $c->get(ContactFormRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$repo instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new CreateContactFormUseCase($repo, $audit, $orgId);
                },
            )
            ->set(
                UpdateContactFormUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateContactFormUseCaseInterface {
                    $repo = $c->get(ContactFormRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$repo instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new UpdateContactFormUseCase($repo, $audit, $orgId);
                },
            )
            ->set(
                DeleteContactFormUseCaseInterface::class,
                static function (ContainerInterface $c): DeleteContactFormUseCaseInterface {
                    $repo = $c->get(ContactFormRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new DeleteContactFormUseCase($repo, $audit);
                },
            )
            ->set(
                ListContactFormsUseCaseInterface::class,
                static function (ContainerInterface $c): ListContactFormsUseCaseInterface {
                    $repo = $c->get(ContactFormRepositoryInterface::class);

                    if (!$repo instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    return new ListContactFormsUseCase($repo);
                },
            )
            ->set(
                GetContactFormByIdUseCaseInterface::class,
                static function (ContainerInterface $c): GetContactFormByIdUseCaseInterface {
                    $repo = $c->get(ContactFormRepositoryInterface::class);

                    if (!$repo instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    return new GetContactFormByIdUseCase($repo);
                },
            )
            ->set(
                CreateContactFormHandler::class,
                static function (ContainerInterface $c): CreateContactFormHandler {
                    $uc = $c->get(CreateContactFormUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CreateContactFormUseCaseInterface) {
                        throw new LogicException('CreateContactForm use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateContactFormHandler($uc, $json);
                },
            )
            ->set(
                UpdateContactFormHandler::class,
                static function (ContainerInterface $c): UpdateContactFormHandler {
                    $uc = $c->get(UpdateContactFormUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateContactFormUseCaseInterface) {
                        throw new LogicException('UpdateContactForm use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateContactFormHandler($uc, $json);
                },
            )
            ->set(
                DeleteContactFormHandler::class,
                static function (ContainerInterface $c): DeleteContactFormHandler {
                    $uc = $c->get(DeleteContactFormUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof DeleteContactFormUseCaseInterface) {
                        throw new LogicException('DeleteContactForm use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteContactFormHandler($uc, $json);
                },
            )
            ->set(
                ListContactFormsHandler::class,
                static function (ContainerInterface $c): ListContactFormsHandler {
                    $uc = $c->get(ListContactFormsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListContactFormsUseCaseInterface) {
                        throw new LogicException('ListContactForms use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListContactFormsHandler($uc, $json);
                },
            )
            ->set(
                GetContactFormByIdHandler::class,
                static function (ContainerInterface $c): GetContactFormByIdHandler {
                    $uc = $c->get(GetContactFormByIdUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetContactFormByIdUseCaseInterface) {
                        throw new LogicException('GetContactFormById use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetContactFormByIdHandler($uc, $json);
                },
            )
            ->set(
                ContactFormNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): ContactFormNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new ContactFormNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                ContactFormRouteRegistrar::class,
                static function (ContainerInterface $c): ContactFormRouteRegistrar {
                    $list = $c->get(ListContactFormsHandler::class);
                    $get = $c->get(GetContactFormByIdHandler::class);
                    $create = $c->get(CreateContactFormHandler::class);
                    $update = $c->get(UpdateContactFormHandler::class);
                    $delete = $c->get(DeleteContactFormHandler::class);

                    if (!$list instanceof ListContactFormsHandler) {
                        throw new LogicException('ListContactForms handler service is invalid.');
                    }

                    if (!$get instanceof GetContactFormByIdHandler) {
                        throw new LogicException('GetContactFormById handler service is invalid.');
                    }

                    if (!$create instanceof CreateContactFormHandler) {
                        throw new LogicException('CreateContactForm handler service is invalid.');
                    }

                    if (!$update instanceof UpdateContactFormHandler) {
                        throw new LogicException('UpdateContactForm handler service is invalid.');
                    }

                    if (!$delete instanceof DeleteContactFormHandler) {
                        throw new LogicException('DeleteContactForm handler service is invalid.');
                    }

                    return new ContactFormRouteRegistrar($list, $get, $create, $update, $delete);
                },
            );
    }
}
