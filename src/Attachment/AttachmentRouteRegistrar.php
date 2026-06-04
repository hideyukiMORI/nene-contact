<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AttachmentRouteRegistrar
{
    public function __construct(
        private UploadAttachmentHandler $uploadHandler,
        private ListSubmissionAttachmentsHandler $listHandler,
        private DownloadAttachmentHandler $downloadHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $upload = $this->uploadHandler;
        $list = $this->listHandler;
        $download = $this->downloadHandler;

        // Public (no auth) — org resolved via public_form_key; throttled by the rate-limit middleware.
        $router->post('/public/forms/{public_form_key}/attachments', static fn (ServerRequestInterface $r) => $upload->handle($r));

        // Admin (org-scoped)
        $router->get('/admin/submissions/{id}/attachments', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/admin/submissions/{id}/attachments/{attachmentId}', static fn (ServerRequestInterface $r) => $download->handle($r));
    }
}
