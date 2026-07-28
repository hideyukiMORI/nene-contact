<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\Http\ExportFilename;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/submissions/export — exports the organization's submissions as CSV
 * (ViewSubmissions, resolved by the /admin/submissions prefix).
 */
final readonly class ExportSubmissionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ExportSubmissionsUseCaseInterface $useCase,
        private Psr17Factory $psr17,
        private ExportFilename $filename,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        $csv = $this->useCase->execute($actorUserId);
        $filename = $this->filename->forPrefix('submissions');

        return $this->psr17->createResponse(200)
            ->withHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->withHeader('Content-Length', (string) strlen($csv))
            ->withBody($this->psr17->createStream($csv));
    }
}
