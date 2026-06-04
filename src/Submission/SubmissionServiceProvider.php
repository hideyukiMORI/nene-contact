<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Notification\SubmissionNotifierInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;

final readonly class SubmissionServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                SubmissionRepositoryInterface::class,
                static function (ContainerInterface $c): SubmissionRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoSubmissionRepository($query, $orgId);
                },
            )
            ->set(
                SubmissionPurgeRepositoryInterface::class,
                static function (ContainerInterface $c): SubmissionPurgeRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoSubmissionPurgeRepository($query);
                },
            )
            ->set(
                PurgeSubmissionsUseCaseInterface::class,
                static function (ContainerInterface $c): PurgeSubmissionsUseCaseInterface {
                    $repo = $c->get(SubmissionPurgeRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof SubmissionPurgeRepositoryInterface) {
                        throw new LogicException('Submission purge repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new PurgeSubmissionsUseCase($repo, $audit);
                },
            )
            ->set(
                PublicFormReaderInterface::class,
                static function (ContainerInterface $c): PublicFormReaderInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoPublicFormReader($query);
                },
            )
            ->set(
                SubmitPublicFormUseCaseInterface::class,
                static function (ContainerInterface $c): SubmitPublicFormUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $notifier = $c->get(SubmissionNotifierInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$notifier instanceof SubmissionNotifierInterface) {
                        throw new LogicException('Submission notifier service is invalid.');
                    }

                    return new SubmitPublicFormUseCase($repo, $audit, $notifier);
                },
            )
            ->set(
                ListSubmissionsUseCaseInterface::class,
                static function (ContainerInterface $c): ListSubmissionsUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    return new ListSubmissionsUseCase($repo);
                },
            )
            ->set(
                GetSubmissionByIdUseCaseInterface::class,
                static function (ContainerInterface $c): GetSubmissionByIdUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    return new GetSubmissionByIdUseCase($repo);
                },
            )
            ->set(
                GetPublicFormSchemaHandler::class,
                static function (ContainerInterface $c): GetPublicFormSchemaHandler {
                    $reader = $c->get(PublicFormReaderInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$reader instanceof PublicFormReaderInterface) {
                        throw new LogicException('Public form reader service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new GetPublicFormSchemaHandler($reader, $json, $pd);
                },
            )
            ->set(
                SubmitPublicFormHandler::class,
                static function (ContainerInterface $c): SubmitPublicFormHandler {
                    $reader = $c->get(PublicFormReaderInterface::class);
                    $uc = $c->get(SubmitPublicFormUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$reader instanceof PublicFormReaderInterface) {
                        throw new LogicException('Public form reader service is invalid.');
                    }

                    if (!$uc instanceof SubmitPublicFormUseCaseInterface) {
                        throw new LogicException('Submit public form use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SubmitPublicFormHandler($reader, $uc, $json, $pd);
                },
            )
            ->set(
                ListSubmissionsHandler::class,
                static function (ContainerInterface $c): ListSubmissionsHandler {
                    $uc = $c->get(ListSubmissionsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListSubmissionsUseCaseInterface) {
                        throw new LogicException('ListSubmissions use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListSubmissionsHandler($uc, $json);
                },
            )
            ->set(
                GetSubmissionByIdHandler::class,
                static function (ContainerInterface $c): GetSubmissionByIdHandler {
                    $uc = $c->get(GetSubmissionByIdUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetSubmissionByIdUseCaseInterface) {
                        throw new LogicException('GetSubmissionById use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetSubmissionByIdHandler($uc, $json);
                },
            )
            ->set(
                SubmissionNoteRepositoryInterface::class,
                static function (ContainerInterface $c): SubmissionNoteRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new PdoSubmissionNoteRepository($query, $orgId);
                },
            )
            ->set(
                UpdateSubmissionStatusUseCaseInterface::class,
                static function (ContainerInterface $c): UpdateSubmissionStatusUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new UpdateSubmissionStatusUseCase($repo, $audit);
                },
            )
            ->set(
                DeleteSubmissionUseCaseInterface::class,
                static function (ContainerInterface $c): DeleteSubmissionUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new DeleteSubmissionUseCase($repo, $audit);
                },
            )
            ->set(
                CorrectSubmissionUseCaseInterface::class,
                static function (ContainerInterface $c): CorrectSubmissionUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $forms = $c->get(ContactFormRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$forms instanceof ContactFormRepositoryInterface) {
                        throw new LogicException('Contact form repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new CorrectSubmissionUseCase($repo, $forms, $audit);
                },
            )
            ->set(
                AddSubmissionNoteUseCaseInterface::class,
                static function (ContainerInterface $c): AddSubmissionNoteUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $notes = $c->get(SubmissionNoteRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$notes instanceof SubmissionNoteRepositoryInterface) {
                        throw new LogicException('Submission note repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    return new AddSubmissionNoteUseCase($repo, $notes, $audit);
                },
            )
            ->set(
                ListSubmissionNotesUseCaseInterface::class,
                static function (ContainerInterface $c): ListSubmissionNotesUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $notes = $c->get(SubmissionNoteRepositoryInterface::class);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$notes instanceof SubmissionNoteRepositoryInterface) {
                        throw new LogicException('Submission note repository service is invalid.');
                    }

                    return new ListSubmissionNotesUseCase($repo, $notes);
                },
            )
            ->set(
                UpdateSubmissionStatusHandler::class,
                static function (ContainerInterface $c): UpdateSubmissionStatusHandler {
                    $uc = $c->get(UpdateSubmissionStatusUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateSubmissionStatusUseCaseInterface) {
                        throw new LogicException('UpdateSubmissionStatus use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateSubmissionStatusHandler($uc, $json);
                },
            )
            ->set(
                DeleteSubmissionHandler::class,
                static function (ContainerInterface $c): DeleteSubmissionHandler {
                    $uc = $c->get(DeleteSubmissionUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof DeleteSubmissionUseCaseInterface) {
                        throw new LogicException('DeleteSubmission use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteSubmissionHandler($uc, $json);
                },
            )
            ->set(
                CorrectSubmissionHandler::class,
                static function (ContainerInterface $c): CorrectSubmissionHandler {
                    $uc = $c->get(CorrectSubmissionUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CorrectSubmissionUseCaseInterface) {
                        throw new LogicException('CorrectSubmission use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CorrectSubmissionHandler($uc, $json);
                },
            )
            ->set(
                AddSubmissionNoteHandler::class,
                static function (ContainerInterface $c): AddSubmissionNoteHandler {
                    $uc = $c->get(AddSubmissionNoteUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof AddSubmissionNoteUseCaseInterface) {
                        throw new LogicException('AddSubmissionNote use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new AddSubmissionNoteHandler($uc, $json);
                },
            )
            ->set(
                ListSubmissionNotesHandler::class,
                static function (ContainerInterface $c): ListSubmissionNotesHandler {
                    $uc = $c->get(ListSubmissionNotesUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListSubmissionNotesUseCaseInterface) {
                        throw new LogicException('ListSubmissionNotes use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListSubmissionNotesHandler($uc, $json);
                },
            )
            ->set(
                ExportSubmissionsUseCaseInterface::class,
                static function (ContainerInterface $c): ExportSubmissionsUseCaseInterface {
                    $repo = $c->get(SubmissionRepositoryInterface::class);
                    $audit = $c->get(AuditRecorderInterface::class);
                    $orgId = $c->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$repo instanceof SubmissionRepositoryInterface) {
                        throw new LogicException('Submission repository service is invalid.');
                    }

                    if (!$audit instanceof AuditRecorderInterface) {
                        throw new LogicException('Audit recorder service is invalid.');
                    }

                    if (!$orgId instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgId */
                    return new ExportSubmissionsUseCase($repo, $audit, $orgId);
                },
            )
            ->set(
                ExportSubmissionsHandler::class,
                static function (ContainerInterface $c): ExportSubmissionsHandler {
                    $uc = $c->get(ExportSubmissionsUseCaseInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$uc instanceof ExportSubmissionsUseCaseInterface) {
                        throw new LogicException('ExportSubmissions use case service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    return new ExportSubmissionsHandler($uc, $psr17);
                },
            )
            ->set(
                SubmissionNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): SubmissionNotFoundExceptionHandler {
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new SubmissionNotFoundExceptionHandler($pd);
                },
            )
            ->set(
                SubmissionRouteRegistrar::class,
                static function (ContainerInterface $c): SubmissionRouteRegistrar {
                    $schema = $c->get(GetPublicFormSchemaHandler::class);
                    $submit = $c->get(SubmitPublicFormHandler::class);
                    $list = $c->get(ListSubmissionsHandler::class);
                    $get = $c->get(GetSubmissionByIdHandler::class);
                    $updateStatus = $c->get(UpdateSubmissionStatusHandler::class);
                    $delete = $c->get(DeleteSubmissionHandler::class);
                    $correct = $c->get(CorrectSubmissionHandler::class);
                    $addNote = $c->get(AddSubmissionNoteHandler::class);
                    $listNotes = $c->get(ListSubmissionNotesHandler::class);
                    $export = $c->get(ExportSubmissionsHandler::class);

                    if (!$schema instanceof GetPublicFormSchemaHandler) {
                        throw new LogicException('Schema handler service is invalid.');
                    }

                    if (!$submit instanceof SubmitPublicFormHandler) {
                        throw new LogicException('Submit handler service is invalid.');
                    }

                    if (!$list instanceof ListSubmissionsHandler) {
                        throw new LogicException('List submissions handler service is invalid.');
                    }

                    if (!$get instanceof GetSubmissionByIdHandler) {
                        throw new LogicException('Get submission handler service is invalid.');
                    }

                    if (!$updateStatus instanceof UpdateSubmissionStatusHandler) {
                        throw new LogicException('Update submission status handler service is invalid.');
                    }

                    if (!$delete instanceof DeleteSubmissionHandler) {
                        throw new LogicException('Delete submission handler service is invalid.');
                    }

                    if (!$correct instanceof CorrectSubmissionHandler) {
                        throw new LogicException('Correct submission handler service is invalid.');
                    }

                    if (!$addNote instanceof AddSubmissionNoteHandler) {
                        throw new LogicException('Add submission note handler service is invalid.');
                    }

                    if (!$listNotes instanceof ListSubmissionNotesHandler) {
                        throw new LogicException('List submission notes handler service is invalid.');
                    }

                    if (!$export instanceof ExportSubmissionsHandler) {
                        throw new LogicException('Export submissions handler service is invalid.');
                    }

                    return new SubmissionRouteRegistrar($schema, $submit, $list, $get, $updateStatus, $delete, $correct, $addNote, $listNotes, $export);
                },
            );
    }
}
