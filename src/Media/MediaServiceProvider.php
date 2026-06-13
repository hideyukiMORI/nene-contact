<?php

declare(strict_types=1);

namespace NeneContact\Media;

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
use Psr\Container\ContainerInterface;

final readonly class MediaServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(MediaImageProcessor::class, static fn (): MediaImageProcessor => new MediaImageProcessor())
            ->set(
                MediaStorageInterface::class,
                static function (ContainerInterface $c): MediaStorageInterface {
                    $root = $c->get(RuntimeServiceProvider::PROJECT_ROOT);
                    if (!is_string($root)) {
                        throw new LogicException('Project root is invalid.');
                    }

                    return new PublicFilesystemMediaStorage($root . '/public_html');
                },
            )
            ->set(
                MediaAssetRepositoryInterface::class,
                static function (ContainerInterface $c): MediaAssetRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoMediaAssetRepository($query);
                },
            )
            ->set(
                UploadMediaUseCaseInterface::class,
                static function (ContainerInterface $c): UploadMediaUseCaseInterface {
                    $processor = $c->get(MediaImageProcessor::class);
                    $storage = $c->get(MediaStorageInterface::class);
                    $assets = $c->get(MediaAssetRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$processor instanceof MediaImageProcessor) {
                        throw new LogicException('Media image processor service is invalid.');
                    }
                    if (!$storage instanceof MediaStorageInterface) {
                        throw new LogicException('Media storage service is invalid.');
                    }
                    if (!$assets instanceof MediaAssetRepositoryInterface) {
                        throw new LogicException('Media asset repository service is invalid.');
                    }
                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }
                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new UploadMediaUseCase($processor, $storage, $assets, $audit, $orgId);
                },
            )
            ->set(
                ListMediaUseCaseInterface::class,
                static function (ContainerInterface $c): ListMediaUseCaseInterface {
                    $assets = $c->get(MediaAssetRepositoryInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$assets instanceof MediaAssetRepositoryInterface) {
                        throw new LogicException('Media asset repository service is invalid.');
                    }
                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new ListMediaUseCase($assets, $orgId);
                },
            )
            ->set(
                DeleteMediaUseCaseInterface::class,
                static function (ContainerInterface $c): DeleteMediaUseCaseInterface {
                    $assets = $c->get(MediaAssetRepositoryInterface::class);
                    $storage = $c->get(MediaStorageInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$assets instanceof MediaAssetRepositoryInterface) {
                        throw new LogicException('Media asset repository service is invalid.');
                    }
                    if (!$storage instanceof MediaStorageInterface) {
                        throw new LogicException('Media storage service is invalid.');
                    }
                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }
                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new DeleteMediaUseCase($assets, $storage, $audit, $orgId);
                },
            )
            ->set(
                UploadMediaHandler::class,
                static function (ContainerInterface $c): UploadMediaHandler {
                    $uc = $c->get(UploadMediaUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    if (!$uc instanceof UploadMediaUseCaseInterface) {
                        throw new LogicException('UploadMedia use case service is invalid.');
                    }
                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UploadMediaHandler($uc, $json);
                },
            )
            ->set(
                ListMediaHandler::class,
                static function (ContainerInterface $c): ListMediaHandler {
                    $uc = $c->get(ListMediaUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    if (!$uc instanceof ListMediaUseCaseInterface) {
                        throw new LogicException('ListMedia use case service is invalid.');
                    }
                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListMediaHandler($uc, $json);
                },
            )
            ->set(
                DeleteMediaHandler::class,
                static function (ContainerInterface $c): DeleteMediaHandler {
                    $uc = $c->get(DeleteMediaUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    if (!$uc instanceof DeleteMediaUseCaseInterface) {
                        throw new LogicException('DeleteMedia use case service is invalid.');
                    }
                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteMediaHandler($uc, $json);
                },
            )
            ->set(
                MediaNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): MediaNotFoundExceptionHandler {
                    $pd = $c->get(ProblemDetailsResponseFactory::class);
                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new MediaNotFoundExceptionHandler($pd);
                },
            )
            ->set(
                MediaRouteRegistrar::class,
                static function (ContainerInterface $c): MediaRouteRegistrar {
                    $upload = $c->get(UploadMediaHandler::class);
                    $list = $c->get(ListMediaHandler::class);
                    $delete = $c->get(DeleteMediaHandler::class);

                    if (!$upload instanceof UploadMediaHandler) {
                        throw new LogicException('UploadMedia handler service is invalid.');
                    }
                    if (!$list instanceof ListMediaHandler) {
                        throw new LogicException('ListMedia handler service is invalid.');
                    }
                    if (!$delete instanceof DeleteMediaHandler) {
                        throw new LogicException('DeleteMedia handler service is invalid.');
                    }

                    return new MediaRouteRegistrar($upload, $list, $delete);
                },
            );
    }
}
