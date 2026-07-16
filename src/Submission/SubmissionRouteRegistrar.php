<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class SubmissionRouteRegistrar
{
    public function __construct(
        private GetPublicFormSchemaHandler $schemaHandler,
        private SubmitPublicFormHandler $submitHandler,
        private ListSubmissionsHandler $listHandler,
        private GetSubmissionByIdHandler $getHandler,
        private GetSubmissionTechnicalMetaHandler $technicalMetaHandler,
        private UpdateSubmissionStatusHandler $updateStatusHandler,
        private DeleteSubmissionHandler $deleteHandler,
        private CorrectSubmissionHandler $correctHandler,
        private AddSubmissionNoteHandler $addNoteHandler,
        private ListSubmissionNotesHandler $listNotesHandler,
        private ExportSubmissionsHandler $exportHandler,
        private PublicFormPageHandler $pageHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $schema = $this->schemaHandler;
        $submit = $this->submitHandler;
        $list = $this->listHandler;
        $get = $this->getHandler;
        $technicalMeta = $this->technicalMetaHandler;
        $updateStatus = $this->updateStatusHandler;
        $delete = $this->deleteHandler;
        $correct = $this->correctHandler;
        $addNote = $this->addNoteHandler;
        $listNotes = $this->listNotesHandler;

        // Public (no auth) — org resolved via public_form_key
        $page = $this->pageHandler;
        $router->get('/public/forms/{public_form_key}/schema', static fn (ServerRequestInterface $r) => $schema->handle($r));
        $router->post('/public/forms/{public_form_key}/submissions', static fn (ServerRequestInterface $r) => $submit->handle($r));
        // Hosted single-form page (link target where a host page's sanitizer strips the embed snippet)
        $router->get('/form/{public_form_key}', static fn (ServerRequestInterface $r) => $page->handle($r));

        // Admin inbox
        $export = $this->exportHandler;
        $router->get('/admin/submissions/export', static fn (ServerRequestInterface $r) => $export->handle($r));
        $router->get('/admin/submissions', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/submissions/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        // Audited IP/UA disclosure (ADR 0018); gated by ViewSubmissionTechnicalMeta.
        $router->get('/admin/submissions/{id}/technical-meta', static fn (ServerRequestInterface $r) => $technicalMeta->handle($r));
        $router->patch('/admin/submissions/{id}', static fn (ServerRequestInterface $r) => $updateStatus->handle($r));
        $router->delete('/admin/submissions/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
        $router->patch('/admin/submissions/{id}/field-values', static fn (ServerRequestInterface $r) => $correct->handle($r));
        $router->get('/admin/submissions/{id}/notes', static fn (ServerRequestInterface $r) => $listNotes->handle($r));
        $router->post('/admin/submissions/{id}/notes', static fn (ServerRequestInterface $r) => $addNote->handle($r));
    }
}
