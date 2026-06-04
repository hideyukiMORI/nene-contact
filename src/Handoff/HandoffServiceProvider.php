<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Attachment\AttachmentRepositoryInterface;
use NeneContact\Attachment\AttachmentStorageInterface;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Submission\SubmissionRepositoryInterface;
use NeneContact\Upstream\DealClientInterface;
use NeneContact\Upstream\HttpDealClient;
use NeneContact\Upstream\HttpInvoiceClient;
use NeneContact\Upstream\HttpVaultClient;
use NeneContact\Upstream\InvoiceClientInterface;
use NeneContact\Upstream\VaultClientInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Client\ClientInterface;

final readonly class HandoffServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                DealClientInterface::class,
                static function (ContainerInterface $c): DealClientInterface {
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    $baseUrl = $_SERVER['NENE_DEAL_API_BASE_URL'] ?? $_ENV['NENE_DEAL_API_BASE_URL'] ?? getenv('NENE_DEAL_API_BASE_URL');
                    $token = $_SERVER['NENE_DEAL_SERVICE_TOKEN'] ?? $_ENV['NENE_DEAL_SERVICE_TOKEN'] ?? getenv('NENE_DEAL_SERVICE_TOKEN');

                    return new HttpDealClient(
                        $http,
                        $psr17,
                        is_string($baseUrl) ? $baseUrl : '',
                        is_string($token) ? $token : '',
                    );
                },
            )
            ->set(
                VaultClientInterface::class,
                static function (ContainerInterface $c): VaultClientInterface {
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    $baseUrl = $_SERVER['NENE_VAULT_API_BASE_URL'] ?? $_ENV['NENE_VAULT_API_BASE_URL'] ?? getenv('NENE_VAULT_API_BASE_URL');
                    $token = $_SERVER['NENE_VAULT_SERVICE_TOKEN'] ?? $_ENV['NENE_VAULT_SERVICE_TOKEN'] ?? getenv('NENE_VAULT_SERVICE_TOKEN');

                    return new HttpVaultClient(
                        $http,
                        $psr17,
                        is_string($baseUrl) ? $baseUrl : '',
                        is_string($token) ? $token : '',
                    );
                },
            )
            ->set(
                InvoiceClientInterface::class,
                static function (ContainerInterface $c): InvoiceClientInterface {
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    $baseUrl = $_SERVER['NENE_INVOICE_API_BASE_URL'] ?? $_ENV['NENE_INVOICE_API_BASE_URL'] ?? getenv('NENE_INVOICE_API_BASE_URL');
                    $token = $_SERVER['NENE_INVOICE_SERVICE_TOKEN'] ?? $_ENV['NENE_INVOICE_SERVICE_TOKEN'] ?? getenv('NENE_INVOICE_SERVICE_TOKEN');

                    return new HttpInvoiceClient(
                        $http,
                        $psr17,
                        is_string($baseUrl) ? $baseUrl : '',
                        is_string($token) ? $token : '',
                    );
                },
            )
            ->set(
                SubmissionLinkRepositoryInterface::class,
                static function (ContainerInterface $c): SubmissionLinkRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoSubmissionLinkRepository($query, $orgId);
                },
            )
            ->set(
                HandoffToDealUseCaseInterface::class,
                static function (ContainerInterface $c): HandoffToDealUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $links = $c->get(SubmissionLinkRepositoryInterface::class);
                    $deal = $c->get(DealClientInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$links instanceof SubmissionLinkRepositoryInterface) {
                        throw new LogicException('Submission link repository service is invalid.');
                    }

                    if (!$deal instanceof DealClientInterface) {
                        throw new LogicException('Deal client service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new HandoffToDealUseCase($submissions, $forms, $links, $deal, $audit);
                },
            )
            ->set(
                HandoffToInvoiceUseCaseInterface::class,
                static function (ContainerInterface $c): HandoffToInvoiceUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $links = $c->get(SubmissionLinkRepositoryInterface::class);
                    $invoice = $c->get(InvoiceClientInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$links instanceof SubmissionLinkRepositoryInterface) {
                        throw new LogicException('Submission link repository service is invalid.');
                    }

                    if (!$invoice instanceof InvoiceClientInterface) {
                        throw new LogicException('Invoice client service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new HandoffToInvoiceUseCase($submissions, $forms, $links, $invoice, $audit);
                },
            )
            ->set(
                HandoffAttachmentToVaultUseCaseInterface::class,
                static function (ContainerInterface $c): HandoffAttachmentToVaultUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $attachments = $c->get(AttachmentRepositoryInterface::class);
                    $storage = $c->get(AttachmentStorageInterface::class);
                    $links = $c->get(SubmissionLinkRepositoryInterface::class);
                    $vault = $c->get(VaultClientInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$attachments instanceof AttachmentRepositoryInterface) {
                        throw new LogicException('Attachment repository service is invalid.');
                    }

                    if (!$storage instanceof AttachmentStorageInterface) {
                        throw new LogicException('Attachment storage service is invalid.');
                    }

                    if (!$links instanceof SubmissionLinkRepositoryInterface) {
                        throw new LogicException('Submission link repository service is invalid.');
                    }

                    if (!$vault instanceof VaultClientInterface) {
                        throw new LogicException('Vault client service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new HandoffAttachmentToVaultUseCase($submissions, $attachments, $storage, $links, $vault, $audit);
                },
            )
            ->set(
                ListSubmissionHandoffsUseCaseInterface::class,
                static function (ContainerInterface $c): ListSubmissionHandoffsUseCaseInterface {
                    $submissions = $c->get(SubmissionRepositoryInterface::class);
                    $links = $c->get(SubmissionLinkRepositoryInterface::class);

                    if (!$submissions instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$links instanceof SubmissionLinkRepositoryInterface) {
                        throw new LogicException('Submission link repository service is invalid.');
                    }

                    return new ListSubmissionHandoffsUseCase($submissions, $links);
                },
            )
            ->set(
                HandoffToDealHandler::class,
                static function (ContainerInterface $c): HandoffToDealHandler {
                    $uc = $c->get(HandoffToDealUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof HandoffToDealUseCaseInterface) {
                        throw new LogicException('HandoffToDeal use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new HandoffToDealHandler($uc, $json);
                },
            )
            ->set(
                HandoffToInvoiceHandler::class,
                static function (ContainerInterface $c): HandoffToInvoiceHandler {
                    $uc = $c->get(HandoffToInvoiceUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof HandoffToInvoiceUseCaseInterface) {
                        throw new LogicException('HandoffToInvoice use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new HandoffToInvoiceHandler($uc, $json);
                },
            )
            ->set(
                HandoffAttachmentToVaultHandler::class,
                static function (ContainerInterface $c): HandoffAttachmentToVaultHandler {
                    $uc = $c->get(HandoffAttachmentToVaultUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof HandoffAttachmentToVaultUseCaseInterface) {
                        throw new LogicException('HandoffAttachmentToVault use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new HandoffAttachmentToVaultHandler($uc, $json);
                },
            )
            ->set(
                ListSubmissionHandoffsHandler::class,
                static function (ContainerInterface $c): ListSubmissionHandoffsHandler {
                    $uc = $c->get(ListSubmissionHandoffsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListSubmissionHandoffsUseCaseInterface) {
                        throw new LogicException('ListSubmissionHandoffs use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListSubmissionHandoffsHandler($uc, $json);
                },
            )
            ->set(
                HandoffRouteRegistrar::class,
                static function (ContainerInterface $c): HandoffRouteRegistrar {
                    $list = $c->get(ListSubmissionHandoffsHandler::class);
                    $deal = $c->get(HandoffToDealHandler::class);
                    $vault = $c->get(HandoffAttachmentToVaultHandler::class);
                    $invoice = $c->get(HandoffToInvoiceHandler::class);

                    if (!$list instanceof ListSubmissionHandoffsHandler) {
                        throw new LogicException('ListSubmissionHandoffs handler service is invalid.');
                    }

                    if (!$deal instanceof HandoffToDealHandler) {
                        throw new LogicException('HandoffToDeal handler service is invalid.');
                    }

                    if (!$vault instanceof HandoffAttachmentToVaultHandler) {
                        throw new LogicException('HandoffAttachmentToVault handler service is invalid.');
                    }

                    if (!$invoice instanceof HandoffToInvoiceHandler) {
                        throw new LogicException('HandoffToInvoice handler service is invalid.');
                    }

                    return new HandoffRouteRegistrar($list, $deal, $vault, $invoice);
                },
            );
    }
}
