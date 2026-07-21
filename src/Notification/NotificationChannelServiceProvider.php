<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
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
use NeneContact\Organization\OrganizationRepositoryInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Client\ClientInterface;
use Symfony\Component\HttpClient\Psr18Client;
use Symfony\Component\Mailer\MailerInterface;

final readonly class NotificationChannelServiceProvider implements ServiceProviderInterface
{
    /** Container key for the shared list<ChannelSenderInterface> (dispatch + test send). */
    public const CHANNEL_SENDERS = 'nene-contact.channel_senders';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                ConfigCipherInterface::class,
                static function (): ConfigCipherInterface {
                    $key = $_SERVER['NENE_CONTACT_ENCRYPTION_KEY'] ?? $_ENV['NENE_CONTACT_ENCRYPTION_KEY'] ?? getenv('NENE_CONTACT_ENCRYPTION_KEY');

                    return new SodiumConfigCipher(is_string($key) ? $key : '');
                },
            )
            ->set(
                NotificationChannelRepositoryInterface::class,
                static function (ContainerInterface $c): NotificationChannelRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);
                    $cipher = $c->get(ConfigCipherInterface::class);
                    $clock = $c->get(ClockInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    if (!$cipher instanceof ConfigCipherInterface) {
                        throw new LogicException('Config cipher service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoNotificationChannelRepository($query, $orgId, $cipher, $clock);
                },
            )
            ->set(
                ClientInterface::class,
                static fn (): ClientInterface => new Psr18Client(),
            )
            ->set(
                OrganizationMailSettingsResolver::class,
                static function (ContainerInterface $c): OrganizationMailSettingsResolver {
                    $orgs = $c->get(OrganizationRepositoryInterface::class);

                    if (!$orgs instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    $from = $_SERVER['MAIL_FROM'] ?? $_ENV['MAIL_FROM'] ?? getenv('MAIL_FROM');
                    $fromAddress = is_string($from) && $from !== '' ? $from : 'noreply@nene-contact.local';

                    return new OrganizationMailSettingsResolver($orgs, $fromAddress);
                },
            )
            ->set(
                self::CHANNEL_SENDERS,
                static function (ContainerInterface $c): array {
                    $mailer = $c->get(MailerInterface::class);
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);
                    $mailSettings = $c->get(OrganizationMailSettingsResolver::class);

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    if (!$mailSettings instanceof OrganizationMailSettingsResolver) {
                        throw new LogicException('Organization mail settings resolver service is invalid.');
                    }

                    return [
                        new EmailChannelSender($mailer, $mailSettings),
                        new SlackChannelSender($http, $psr17),
                        new ChatworkChannelSender($http, $psr17),
                        new WebhookChannelSender($http, $psr17),
                    ];
                },
            )
            ->set(
                SubmissionNotifierInterface::class,
                static function (ContainerInterface $c): SubmissionNotifierInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $senders = $c->get(self::CHANNEL_SENDERS);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!is_array($senders)) {
                        throw new LogicException('Channel senders service is invalid.');
                    }

                    /** @var list<ChannelSenderInterface> $senders */
                    return new CompositeSubmissionNotifier($channels, $senders);
                },
            )
            ->set(
                SenderAutoReplyInterface::class,
                static function (ContainerInterface $c): SenderAutoReplyInterface {
                    $mailer = $c->get(MailerInterface::class);
                    $cooldown = $c->get(RateLimitStorageInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $mailSettings = $c->get(OrganizationMailSettingsResolver::class);

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    if (!$cooldown instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$mailSettings instanceof OrganizationMailSettingsResolver) {
                        throw new LogicException('Organization mail settings resolver service is invalid.');
                    }

                    return new SenderAutoReply($mailer, $mailSettings, $cooldown, $audit);
                },
            )
            ->set(
                CreateNotificationChannelUseCaseInterface::class,
                static function (ContainerInterface $c): CreateNotificationChannelUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new CreateNotificationChannelUseCase($channels, $forms, $audit, $orgId);
                },
            )
            ->set(
                ListNotificationChannelsUseCaseInterface::class,
                static function (ContainerInterface $c): ListNotificationChannelsUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    return new ListNotificationChannelsUseCase($channels);
                },
            )
            ->set(
                GetNotificationChannelUseCaseInterface::class,
                static function (ContainerInterface $c): GetNotificationChannelUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    return new GetNotificationChannelUseCase($channels);
                },
            )
            ->set(
                UpdateNotificationChannelUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateNotificationChannelUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new UpdateNotificationChannelUseCase($channels, $audit);
                },
            )
            ->set(
                DeleteNotificationChannelUseCaseInterface::class,
                static function (ContainerInterface $c): DeleteNotificationChannelUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new DeleteNotificationChannelUseCase($channels, $audit);
                },
            )
            ->set(
                TestNotificationChannelUseCaseInterface::class,
                static function (ContainerInterface $c): TestNotificationChannelUseCaseInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $senders = $c->get(self::CHANNEL_SENDERS);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!is_array($senders)) {
                        throw new LogicException('Channel senders service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    /** @var list<ChannelSenderInterface> $senders */
                    return new TestNotificationChannelUseCase($channels, $forms, $senders, $audit);
                },
            )
            ->set(
                CreateNotificationChannelHandler::class,
                static function (ContainerInterface $c): CreateNotificationChannelHandler {
                    $uc = $c->get(CreateNotificationChannelUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CreateNotificationChannelUseCaseInterface) {
                        throw new LogicException('CreateNotificationChannel use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateNotificationChannelHandler($uc, $json);
                },
            )
            ->set(
                ListNotificationChannelsHandler::class,
                static function (ContainerInterface $c): ListNotificationChannelsHandler {
                    $uc = $c->get(ListNotificationChannelsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListNotificationChannelsUseCaseInterface) {
                        throw new LogicException('ListNotificationChannels use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListNotificationChannelsHandler($uc, $json);
                },
            )
            ->set(
                GetNotificationChannelHandler::class,
                static function (ContainerInterface $c): GetNotificationChannelHandler {
                    $uc = $c->get(GetNotificationChannelUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetNotificationChannelUseCaseInterface) {
                        throw new LogicException('GetNotificationChannel use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetNotificationChannelHandler($uc, $json);
                },
            )
            ->set(
                UpdateNotificationChannelHandler::class,
                static function (ContainerInterface $c): UpdateNotificationChannelHandler {
                    $uc = $c->get(UpdateNotificationChannelUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateNotificationChannelUseCaseInterface) {
                        throw new LogicException('UpdateNotificationChannel use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateNotificationChannelHandler($uc, $json);
                },
            )
            ->set(
                DeleteNotificationChannelHandler::class,
                static function (ContainerInterface $c): DeleteNotificationChannelHandler {
                    $uc = $c->get(DeleteNotificationChannelUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof DeleteNotificationChannelUseCaseInterface) {
                        throw new LogicException('DeleteNotificationChannel use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteNotificationChannelHandler($uc, $json);
                },
            )
            ->set(
                TestNotificationChannelHandler::class,
                static function (ContainerInterface $c): TestNotificationChannelHandler {
                    $uc = $c->get(TestNotificationChannelUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof TestNotificationChannelUseCaseInterface) {
                        throw new LogicException('TestNotificationChannel use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new TestNotificationChannelHandler($uc, $json);
                },
            )
            ->set(
                NotificationChannelNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): NotificationChannelNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new NotificationChannelNotFoundExceptionHandler($problemDetails);
                },
            )
            ->set(
                NotificationChannelRouteRegistrar::class,
                static function (ContainerInterface $c): NotificationChannelRouteRegistrar {
                    $list = $c->get(ListNotificationChannelsHandler::class);
                    $get = $c->get(GetNotificationChannelHandler::class);
                    $create = $c->get(CreateNotificationChannelHandler::class);
                    $update = $c->get(UpdateNotificationChannelHandler::class);
                    $delete = $c->get(DeleteNotificationChannelHandler::class);
                    $test = $c->get(TestNotificationChannelHandler::class);

                    if (!$list instanceof ListNotificationChannelsHandler) {
                        throw new LogicException('ListNotificationChannels handler service is invalid.');
                    }

                    if (!$get instanceof GetNotificationChannelHandler) {
                        throw new LogicException('GetNotificationChannel handler service is invalid.');
                    }

                    if (!$create instanceof CreateNotificationChannelHandler) {
                        throw new LogicException('CreateNotificationChannel handler service is invalid.');
                    }

                    if (!$update instanceof UpdateNotificationChannelHandler) {
                        throw new LogicException('UpdateNotificationChannel handler service is invalid.');
                    }

                    if (!$delete instanceof DeleteNotificationChannelHandler) {
                        throw new LogicException('DeleteNotificationChannel handler service is invalid.');
                    }

                    if (!$test instanceof TestNotificationChannelHandler) {
                        throw new LogicException('TestNotificationChannel handler service is invalid.');
                    }

                    return new NotificationChannelRouteRegistrar($list, $get, $create, $update, $delete, $test);
                },
            );
    }
}
