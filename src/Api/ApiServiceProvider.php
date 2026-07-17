<?php

declare(strict_types=1);

namespace NeneContact\Api;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use Nene2\Middleware\RateLimitStorageInterface;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Notification\SubmissionNotifierInterface;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Submission\UpdateSubmissionStatusUseCaseInterface;
use Psr\Container\ContainerInterface;

final readonly class ApiServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ConfirmationToken::class,
                static function (ContainerInterface $c): ConfirmationToken {
                    // Server-side signing secret (the caller never holds it, so it cannot forge
                    // a token without doing phase 1). Reuses the local JWT secret.
                    $secret = $_SERVER['NENE2_LOCAL_JWT_SECRET'] ?? $_ENV['NENE2_LOCAL_JWT_SECRET'] ?? getenv('NENE2_LOCAL_JWT_SECRET');
                    $clock = $c->get(ClockInterface::class);

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new ConfirmationToken(is_string($secret) ? $secret : '', $clock);
                },
            )
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
                    $rateLimit = $c->get(RateLimitStorageInterface::class);
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);
                    $clock = $c->get(ClockInterface::class);

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$uc instanceof IngestSubmissionUseCaseInterface) {
                        throw new LogicException('IngestSubmission use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$rateLimit instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new IngestSubmissionHandler($forms, $uc, $json, $rateLimit, $problemDetails, $clock);
                },
            )
            ->set(
                UpdateSubmissionStatusAgentHandler::class,
                static function (ContainerInterface $c): UpdateSubmissionStatusAgentHandler {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $uc = $c->get(UpdateSubmissionStatusUseCaseInterface::class);
                    $confirmation = $c->get(ConfirmationToken::class);
                    $json = $c->get(JsonResponseFactory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$uc instanceof UpdateSubmissionStatusUseCaseInterface) {
                        throw new LogicException('UpdateSubmissionStatus use case service is invalid.');
                    }

                    if (!$confirmation instanceof ConfirmationToken) {
                        throw new LogicException('Confirmation token service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new UpdateSubmissionStatusAgentHandler($submissions, $uc, $confirmation, $json, $pd);
                },
            )
            ->set(
                ApiRouteRegistrar::class,
                static function (ContainerInterface $c): ApiRouteRegistrar {
                    $forms = $c->get(ListAgentFormsHandler::class);
                    $list = $c->get(ListAgentSubmissionsHandler::class);
                    $get = $c->get(GetAgentSubmissionHandler::class);
                    $ingest = $c->get(IngestSubmissionHandler::class);
                    $updateStatus = $c->get(UpdateSubmissionStatusAgentHandler::class);

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

                    if (!$updateStatus instanceof UpdateSubmissionStatusAgentHandler) {
                        throw new LogicException('UpdateSubmissionStatusAgent handler service is invalid.');
                    }

                    return new ApiRouteRegistrar($forms, $list, $get, $ingest, $updateStatus);
                },
            );
    }
}
