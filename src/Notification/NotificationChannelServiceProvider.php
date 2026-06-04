<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Client\ClientInterface;
use Symfony\Component\HttpClient\Psr18Client;
use Symfony\Component\Mailer\MailerInterface;

final readonly class NotificationChannelServiceProvider implements ServiceProviderInterface
{
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

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    if (!$cipher instanceof ConfigCipherInterface) {
                        throw new LogicException('Config cipher service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoNotificationChannelRepository($query, $orgId, $cipher);
                },
            )
            ->set(
                ClientInterface::class,
                static fn (): ClientInterface => new Psr18Client(),
            )
            ->set(
                SubmissionNotifierInterface::class,
                static function (ContainerInterface $c): SubmissionNotifierInterface {
                    $channels = $c->get(NotificationChannelRepositoryInterface::class);
                    $mailer = $c->get(MailerInterface::class);
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$channels instanceof NotificationChannelRepositoryInterface) {
                        throw new LogicException('Notification channel repository service is invalid.');
                    }

                    if (!$mailer instanceof MailerInterface) {
                        throw new LogicException('Mailer service is invalid.');
                    }

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    $from = $_SERVER['MAIL_FROM'] ?? $_ENV['MAIL_FROM'] ?? getenv('MAIL_FROM');
                    $fromAddress = is_string($from) && $from !== '' ? $from : 'noreply@nene-contact.local';

                    return new CompositeSubmissionNotifier($channels, [
                        new EmailChannelSender($mailer, $fromAddress),
                        new SlackChannelSender($http, $psr17),
                        new ChatworkChannelSender($http, $psr17),
                        new WebhookChannelSender($http, $psr17),
                    ]);
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
                NotificationChannelRouteRegistrar::class,
                static function (ContainerInterface $c): NotificationChannelRouteRegistrar {
                    $list = $c->get(ListNotificationChannelsHandler::class);
                    $create = $c->get(CreateNotificationChannelHandler::class);

                    if (!$list instanceof ListNotificationChannelsHandler) {
                        throw new LogicException('ListNotificationChannels handler service is invalid.');
                    }

                    if (!$create instanceof CreateNotificationChannelHandler) {
                        throw new LogicException('CreateNotificationChannel handler service is invalid.');
                    }

                    return new NotificationChannelRouteRegistrar($list, $create);
                },
            );
    }
}
