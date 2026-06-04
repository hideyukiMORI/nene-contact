<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Agent read surface routes under `/api/*` — protected by the machine API key
 * (`X-NENE2-API-Key`, wired in {@see \NeneContact\Http\RuntimeServiceProvider}). This is the
 * OpenAPI surface MCP tools map to (ADR 0002: Contact OpenAPI only, no sibling DB).
 */
final readonly class ApiRouteRegistrar
{
    public function __construct(
        private ListAgentFormsHandler $formsHandler,
        private ListAgentSubmissionsHandler $listSubmissionsHandler,
        private GetAgentSubmissionHandler $getSubmissionHandler,
        private IngestSubmissionHandler $ingestHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $forms = $this->formsHandler;
        $list = $this->listSubmissionsHandler;
        $get = $this->getSubmissionHandler;
        $ingest = $this->ingestHandler;

        $router->get('/api/forms', static fn (ServerRequestInterface $r) => $forms->handle($r));
        $router->get('/api/submissions', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/api/submissions', static fn (ServerRequestInterface $r) => $ingest->handle($r));
        $router->get('/api/submissions/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
    }
}
