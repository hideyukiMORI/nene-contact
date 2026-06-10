<?php

declare(strict_types=1);

namespace NeneContact;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Api\ApiRouteRegistrar;
use NeneContact\Api\ApiServiceProvider;
use NeneContact\Attachment\AttachmentNotFoundExceptionHandler;
use NeneContact\Attachment\AttachmentRouteRegistrar;
use NeneContact\Attachment\AttachmentServiceProvider;
use NeneContact\Audit\AuditRouteRegistrar;
use NeneContact\Audit\AuditServiceProvider;
use NeneContact\Auth\AuthRouteRegistrar;
use NeneContact\Auth\AuthServiceProvider;
use NeneContact\Auth\EmailConflictExceptionHandler;
use NeneContact\Auth\InvalidCredentialsExceptionHandler;
use NeneContact\Auth\UserAdminRouteRegistrar;
use NeneContact\Auth\UserNotFoundExceptionHandler;
use NeneContact\ContactForm\ContactFormNotFoundExceptionHandler;
use NeneContact\ContactForm\ContactFormRouteRegistrar;
use NeneContact\ContactForm\ContactFormServiceProvider;
use NeneContact\Handoff\HandoffRouteRegistrar;
use NeneContact\Handoff\HandoffServiceProvider;
use NeneContact\Notification\NotificationChannelRouteRegistrar;
use NeneContact\Notification\NotificationChannelServiceProvider;
use NeneContact\Organization\OrganizationNotFoundExceptionHandler;
use NeneContact\Organization\OrganizationRouteRegistrar;
use NeneContact\Organization\OrganizationServiceProvider;
use NeneContact\Organization\OrganizationSlugConflictExceptionHandler;
use NeneContact\RateLimit\RateLimitServiceProvider;
use NeneContact\Records\RecordsRouteRegistrar;
use NeneContact\Records\RecordsServiceProvider;
use NeneContact\Submission\SubmissionNotFoundExceptionHandler;
use NeneContact\Submission\SubmissionRouteRegistrar;
use NeneContact\Submission\SubmissionServiceProvider;
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

        $builder->addProvider(new RateLimitServiceProvider());
        $builder->addProvider(new AuditServiceProvider());
        $builder->addProvider(new AuthServiceProvider());
        $builder->addProvider(new OrganizationServiceProvider());
        $builder->addProvider(new ContactFormServiceProvider());
        $builder->addProvider(new NotificationChannelServiceProvider());
        $builder->addProvider(new SubmissionServiceProvider());
        $builder->addProvider(new AttachmentServiceProvider());
        $builder->addProvider(new HandoffServiceProvider());
        $builder->addProvider(new ApiServiceProvider());
        $builder->addProvider(new RecordsServiceProvider());

        $builder
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $container): array {
                    $auth = $container->get(AuthRouteRegistrar::class);
                    $userAdmin = $container->get(UserAdminRouteRegistrar::class);
                    $organization = $container->get(OrganizationRouteRegistrar::class);
                    $contactForm = $container->get(ContactFormRouteRegistrar::class);
                    $submission = $container->get(SubmissionRouteRegistrar::class);
                    $attachment = $container->get(AttachmentRouteRegistrar::class);
                    $handoff = $container->get(HandoffRouteRegistrar::class);
                    $api = $container->get(ApiRouteRegistrar::class);
                    $records = $container->get(RecordsRouteRegistrar::class);
                    $notificationChannel = $container->get(NotificationChannelRouteRegistrar::class);
                    $audit = $container->get(AuditRouteRegistrar::class);

                    if (!$auth instanceof AuthRouteRegistrar) {
                        throw new LogicException('Auth route registrar service is invalid.');
                    }

                    if (!$userAdmin instanceof UserAdminRouteRegistrar) {
                        throw new LogicException('User admin route registrar service is invalid.');
                    }

                    if (!$organization instanceof OrganizationRouteRegistrar) {
                        throw new LogicException('Organization route registrar service is invalid.');
                    }

                    if (!$contactForm instanceof ContactFormRouteRegistrar) {
                        throw new LogicException('Contact form route registrar service is invalid.');
                    }

                    if (!$submission instanceof SubmissionRouteRegistrar) {
                        throw new LogicException('Submission route registrar service is invalid.');
                    }

                    if (!$attachment instanceof AttachmentRouteRegistrar) {
                        throw new LogicException('Attachment route registrar service is invalid.');
                    }

                    if (!$handoff instanceof HandoffRouteRegistrar) {
                        throw new LogicException('Handoff route registrar service is invalid.');
                    }

                    if (!$api instanceof ApiRouteRegistrar) {
                        throw new LogicException('Api route registrar service is invalid.');
                    }

                    if (!$records instanceof RecordsRouteRegistrar) {
                        throw new LogicException('Records route registrar service is invalid.');
                    }

                    if (!$notificationChannel instanceof NotificationChannelRouteRegistrar) {
                        throw new LogicException('Notification channel route registrar service is invalid.');
                    }

                    if (!$audit instanceof AuditRouteRegistrar) {
                        throw new LogicException('Audit route registrar service is invalid.');
                    }

                    return [
                        $auth,
                        $userAdmin,
                        $organization,
                        $contactForm,
                        $notificationChannel,
                        $submission,
                        $attachment,
                        $handoff,
                        $api,
                        $records,
                        $audit,
                    ];
                },
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $container): array {
                    $invalidCredentials = $container->get(InvalidCredentialsExceptionHandler::class);
                    $userNotFound = $container->get(UserNotFoundExceptionHandler::class);
                    $emailConflict = $container->get(EmailConflictExceptionHandler::class);
                    $organizationNotFound = $container->get(OrganizationNotFoundExceptionHandler::class);
                    $organizationSlugConflict = $container->get(OrganizationSlugConflictExceptionHandler::class);
                    $contactFormNotFound = $container->get(ContactFormNotFoundExceptionHandler::class);
                    $submissionNotFound = $container->get(SubmissionNotFoundExceptionHandler::class);
                    $attachmentNotFound = $container->get(AttachmentNotFoundExceptionHandler::class);

                    foreach ([$invalidCredentials, $userNotFound, $emailConflict, $organizationNotFound, $organizationSlugConflict, $contactFormNotFound, $submissionNotFound, $attachmentNotFound] as $handler) {
                        if (!$handler instanceof DomainExceptionHandlerInterface) {
                            throw new LogicException('Exception handler service is invalid.');
                        }
                    }

                    return [
                        $invalidCredentials,
                        $userNotFound,
                        $emailConflict,
                        $organizationNotFound,
                        $organizationSlugConflict,
                        $contactFormNotFound,
                        $submissionNotFound,
                        $attachmentNotFound,
                    ];
                },
            );
    }
}
