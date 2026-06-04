<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\Http\RuntimeServiceProvider;
use NeneContact\Submission\PublicFormReaderInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;

final readonly class AttachmentServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                AttachmentRepositoryInterface::class,
                static function (ContainerInterface $c): AttachmentRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoAttachmentRepository($query, $orgId);
                },
            )
            ->set(
                AttachmentPurgeRepositoryInterface::class,
                static function (ContainerInterface $c): AttachmentPurgeRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAttachmentPurgeRepository($query);
                },
            )
            ->set(
                AttachmentStorageInterface::class,
                static function (ContainerInterface $c): AttachmentStorageInterface {
                    $root = $c->get(RuntimeServiceProvider::PROJECT_ROOT);

                    if (!is_string($root)) {
                        throw new LogicException('Project root is invalid.');
                    }

                    return new FilesystemAttachmentStorage($root . '/var/attachments');
                },
            )
            ->set(
                AttachmentScannerInterface::class,
                static fn (): AttachmentScannerInterface => new NullAttachmentScanner(),
            )
            ->set(
                UploadAttachmentHandler::class,
                static function (ContainerInterface $c): UploadAttachmentHandler {
                    $forms = $c->get(PublicFormReaderInterface::class);
                    $attachments = $c->get(AttachmentRepositoryInterface::class);
                    $storage = $c->get(AttachmentStorageInterface::class);
                    $scanner = $c->get(AttachmentScannerInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$forms instanceof PublicFormReaderInterface) {
                        throw new LogicException('Public form reader service is invalid.');
                    }

                    if (!$attachments instanceof AttachmentRepositoryInterface) {
                        throw new LogicException('Attachment repository service is invalid.');
                    }

                    if (!$storage instanceof AttachmentStorageInterface) {
                        throw new LogicException('Attachment storage service is invalid.');
                    }

                    if (!$scanner instanceof AttachmentScannerInterface) {
                        throw new LogicException('Attachment scanner service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new UploadAttachmentHandler($forms, $attachments, $storage, $scanner, $json, $pd);
                },
            )
            ->set(
                ListSubmissionAttachmentsHandler::class,
                static function (ContainerInterface $c): ListSubmissionAttachmentsHandler {
                    $attachments = $c->get(AttachmentRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$attachments instanceof AttachmentRepositoryInterface) {
                        throw new LogicException('Attachment repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListSubmissionAttachmentsHandler($attachments, $json);
                },
            )
            ->set(
                DownloadAttachmentHandler::class,
                static function (ContainerInterface $c): DownloadAttachmentHandler {
                    $attachments = $c->get(AttachmentRepositoryInterface::class);
                    $storage = $c->get(AttachmentStorageInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$attachments instanceof AttachmentRepositoryInterface) {
                        throw new LogicException('Attachment repository service is invalid.');
                    }

                    if (!$storage instanceof AttachmentStorageInterface) {
                        throw new LogicException('Attachment storage service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new DownloadAttachmentHandler($attachments, $storage, $audit, $psr17, $pd);
                },
            )
            ->set(
                AttachmentRouteRegistrar::class,
                static function (ContainerInterface $c): AttachmentRouteRegistrar {
                    $upload = $c->get(UploadAttachmentHandler::class);
                    $list = $c->get(ListSubmissionAttachmentsHandler::class);
                    $download = $c->get(DownloadAttachmentHandler::class);

                    if (!$upload instanceof UploadAttachmentHandler) {
                        throw new LogicException('Upload attachment handler service is invalid.');
                    }

                    if (!$list instanceof ListSubmissionAttachmentsHandler) {
                        throw new LogicException('List submission attachments handler service is invalid.');
                    }

                    if (!$download instanceof DownloadAttachmentHandler) {
                        throw new LogicException('Download attachment handler service is invalid.');
                    }

                    return new AttachmentRouteRegistrar($upload, $list, $download);
                },
            );
    }
}
