<?php

declare(strict_types=1);

namespace NeneContact\Http;

use NeneContact\Submission\PublicFormReaderInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Per-form CORS for the public embed endpoints (ADR 0010 / charter §6). The widget runs on
 * the operator's site, so the request `Origin` is reflected in `Access-Control-Allow-Origin`
 * only when it is allowed by the form's `allowed_origins` — never `*`. A form with no
 * configured origins is open (mirrors the submit origin check), echoing the request Origin.
 *
 * Only **actual** (non-preflight) responses are decorated. The embed widget deliberately
 * issues CORS "simple" requests — GET for the schema, `multipart/form-data` for uploads,
 * and `text/plain` JSON for submit — so no `OPTIONS` preflight is triggered (the NENE2
 * pipeline owns OPTIONS). This keeps cross-origin embedding working without a preflight
 * round-trip.
 */
final readonly class PublicCorsMiddleware implements MiddlewareInterface
{
    public function __construct(
        private PublicFormReaderInterface $forms,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        $formKey = $this->publicFormKey($request);
        $origin = $request->getHeaderLine('Origin');

        if ($formKey === null || $origin === '' || !$this->originAllowed($formKey, $origin)) {
            return $response;
        }

        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Vary', 'Origin');
    }

    private function publicFormKey(ServerRequestInterface $request): ?string
    {
        if (preg_match('#^/public/forms/([^/]+)/(schema|submissions|attachments)$#', $request->getUri()->getPath(), $m) === 1) {
            return $m[1];
        }

        return null;
    }

    private function originAllowed(string $formKey, string $origin): bool
    {
        $form = $this->forms->findByPublicFormKey($formKey);
        if ($form === null) {
            return false;
        }

        // No configured origins => open form (mirrors SubmitPublicFormHandler::originAllowed).
        return $form->allowedOrigins === [] || in_array($origin, $form->allowedOrigins, true);
    }
}
