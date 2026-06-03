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
    ) {
    }

    public function __invoke(Router $router): void
    {
        $schema = $this->schemaHandler;
        $submit = $this->submitHandler;
        $list = $this->listHandler;
        $get = $this->getHandler;

        // Public (no auth) — org resolved via public_form_key
        $router->get('/public/forms/{public_form_key}/schema', static fn (ServerRequestInterface $r) => $schema->handle($r));
        $router->post('/public/forms/{public_form_key}/submissions', static fn (ServerRequestInterface $r) => $submit->handle($r));

        // Admin inbox (ViewSubmissions)
        $router->get('/admin/submissions', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/submissions/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
    }
}
