<?php

declare(strict_types=1);

namespace NeneContact\Api;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Notification\SubmissionNotifierInterface;
use NeneContact\Submission\SubmissionRepositoryInterface;
use Psr\Container\ContainerInterface;

final readonly class ApiServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ListAgentFormsUseCaseInterface::class,
                static function (ContainerInterface $c): ListAgentFormsUseCaseInterface {
                    $forms = $c->get(ContactFormRepositoryInterface::class);

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    return new ListAgentFormsUseCase($forms);
                },
            )
            ->set(
                ListAgentSubmissionsUseCaseInterface::class,
                static function (ContainerInterface $c): ListAgentSubmissionsUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new ListAgentSubmissionsUseCase($submissions, $audit, $orgId);
                },
            )
            ->set(
                GetAgentSubmissionUseCaseInterface::class,
                static function (ContainerInterface $c): GetAgentSubmissionUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new GetAgentSubmissionUseCase($submissions, $audit);
                },
            )
            ->set(
                IngestSubmissionUseCaseInterface::class,
                static function (ContainerInterface $c): IngestSubmissionUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $notifier = $c->get(SubmissionNotifierInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$notifier instanceof SubmissionNotifierInterface) {
                        throw new LogicException('Submission notifier service is invalid.');
                    }

                    return new IngestSubmissionUseCase($submissions, $audit, $notifier);
                },
            )
            ->set(
                ListAgentFormsHandler::class,
                static function (ContainerInterface $c): ListAgentFormsHandler {
                    $uc = $c->get(ListAgentFormsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListAgentFormsUseCaseInterface) {
                        throw new LogicException('ListAgentForms use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListAgentFormsHandler($uc, $json);
                },
            )
            ->set(
                ListAgentSubmissionsHandler::class,
                static function (ContainerInterface $c): ListAgentSubmissionsHandler {
                    $uc = $c->get(ListAgentSubmissionsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListAgentSubmissionsUseCaseInterface) {
                        throw new LogicException('ListAgentSubmissions use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListAgentSubmissionsHandler($uc, $json);
                },
            )
            ->set(
                GetAgentSubmissionHandler::class,
                static function (ContainerInterface $c): GetAgentSubmissionHandler {
                    $uc = $c->get(GetAgentSubmissionUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetAgentSubmissionUseCaseInterface) {
                        throw new LogicException('GetAgentSubmission use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetAgentSubmissionHandler($uc, $json);
                },
            )
            ->set(
                IngestSubmissionHandler::class,
                static function (ContainerInterface $c): IngestSubmissionHandler {
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $uc = $c->get(IngestSubmissionUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$uc instanceof IngestSubmissionUseCaseInterface) {
                        throw new LogicException('IngestSubmission use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new IngestSubmissionHandler($forms, $uc, $json);
                },
            )
            ->set(
                ApiRouteRegistrar::class,
                static function (ContainerInterface $c): ApiRouteRegistrar {
                    $forms = $c->get(ListAgentFormsHandler::class);
                    $list = $c->get(ListAgentSubmissionsHandler::class);
                    $get = $c->get(GetAgentSubmissionHandler::class);
                    $ingest = $c->get(IngestSubmissionHandler::class);

                    if (!$forms instanceof ListAgentFormsHandler) {
                        throw new LogicException('ListAgentForms handler service is invalid.');
                    }

                    if (!$list instanceof ListAgentSubmissionsHandler) {
                        throw new LogicException('ListAgentSubmissions handler service is invalid.');
                    }

                    if (!$get instanceof GetAgentSubmissionHandler) {
                        throw new LogicException('GetAgentSubmission handler service is invalid.');
                    }

                    if (!$ingest instanceof IngestSubmissionHandler) {
                        throw new LogicException('IngestSubmission handler service is invalid.');
                    }

                    return new ApiRouteRegistrar($forms, $list, $get, $ingest);
                },
            );
    }
}
