<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Routing\Router;
use NeneContact\Audit\AuditRecorderInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /admin/submissions/{id}/attachments/{attachmentId} — download attachment bytes
 * (organization-scoped). PII access is audited `attachment.viewed` (charter §10).
 */
final readonly class DownloadAttachmentHandler implements RequestHandlerInterface
{
    public function __construct(
        private AttachmentRepositoryInterface $attachments,
        private AttachmentStorageInterface $storage,
        private AuditRecorderInterface $audit,
        private Psr17Factory $psr17,
        private ProblemDetailsResponseFactory $problemDetails,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $submissionId = (int) ($parameters['id'] ?? 0);
        $attachmentId = (int) ($parameters['attachmentId'] ?? 0);

        $attachment = $this->attachments->findForDownload($attachmentId, $submissionId);
        if ($attachment === null || $attachment->storageKey === null) {
            return $this->problemDetails->create($request, 'attachment-not-found', 'Attachment Not Found', 404, 'The requested attachment was not found.');
        }

        $bytes = $this->storage->get($attachment->storageKey);
        if ($bytes === null) {
            return $this->problemDetails->create($request, 'attachment-not-found', 'Attachment Not Found', 404, 'The requested attachment was not found.');
        }

        $claims = $request->getAttribute('nene2.auth.claims');
        $actorUserId = is_array($claims) && isset($claims['uid']) && is_int($claims['uid']) ? $claims['uid'] : null;

        // PII access audit (§10): who/when viewed the attachment; no bytes in the trail.
        $this->audit->record(
            $actorUserId,
            $attachment->organizationId,
            'attachment.viewed',
            'attachment',
            $attachment->id,
            null,
            ['submission_id' => $submissionId, 'content_type' => $attachment->contentType, 'size_bytes' => $attachment->sizeBytes],
        );

        return $this->psr17->createResponse(200)
            ->withHeader('Content-Type', $attachment->contentType)
            ->withHeader('Content-Disposition', 'attachment; filename="' . str_replace('"', '', $attachment->originalFilename) . '"')
            ->withHeader('Content-Length', (string) strlen($bytes))
            ->withBody($this->psr17->createStream($bytes));
    }
}
