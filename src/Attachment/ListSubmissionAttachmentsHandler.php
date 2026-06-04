<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/submissions/{id}/attachments — list a submission's attachments (metadata only,
 * organization-scoped). No bytes; download is a separate audited endpoint.
 */
final readonly class ListSubmissionAttachmentsHandler implements RequestHandlerInterface
{
    public function __construct(
        private AttachmentRepositoryInterface $attachments,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($parameters['id'] ?? 0);

        $items = array_map(
            static fn (Attachment $a): array => AttachmentResponse::toArray($a),
            $this->attachments->listBySubmission($submissionId),
        );

        return $this->response->create(['items' => $items]);
    }
}
